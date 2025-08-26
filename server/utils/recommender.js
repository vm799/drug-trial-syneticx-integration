// utils/recommender.js
import axios from 'axios';
import OpenAI from 'openai';
import User from '../models/User.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 });  // 24-hour cache TTL

let openai = null;
const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not provided - recommendations will be limited');
      return null;
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

export const fetchNewRecommendations = async (user) => {
  const cacheKey = `recs_${user._id}`;
  let cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    // Step 1: Fetch raw data from public APIs (e.g., ClinicalTrials.gov)
    const interests = user.interests.join(' OR ');  // e.g., 'neuromodulation OR biotech'
    const sinceDate = user.lastRecommendationDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);  // Last 7 days
    const params = {
      query: `search=${interests}&min_rnk=1&max_rnk=10&fmt=json&since=${sinceDate.toISOString().split('T')[0]}`,
    };
    const response = await axios.get(process.env.CLINICAL_TRIALS_API_URL, { params });

    const rawData = response.data.studies || [];  // Array of trial objects

    if (rawData.length === 0) {
      // Fallback to openFDA or PubMed if no results
      const fallbackResponse = await axios.get(`${process.env.OPENFDA_API_URL}?search=${interests}&limit=10`);
      rawData = fallbackResponse.data.results || [];
    }

    // Step 2: Use OpenAI to analyze/summarize raw data into recommendations
    const prompt = `Based on user interests: ${user.interests.join(', ')}. Summarize these new drug/trial data into 3-5 personalized recommendations, including titles, summaries, and links. Focus on recent updates since ${sinceDate.toISOString()}. Data: ${JSON.stringify(rawData.slice(0, 5))}.`;  // Limit data to avoid token limits

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',  // Cost-effective model
      messages: [{ role: 'system', content: 'You are a MedTech research recommender.' }, { role: 'user', content: prompt }],
    });

    const recommendations = JSON.parse(completion.choices[0].message.content);  // Assume OpenAI outputs JSON array

    // Update last date and cache
    await User.updateOne({ _id: user._id }, { lastRecommendationDate: new Date() });
    cache.set(cacheKey, recommendations);

    return recommendations;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    // Handle downtime/errors: Explain in logs/email, fallback to cache
    if (cached) return cached;  // Use stale cache if available
    return [];  // Or explain in email: "API downtime—recommendations delayed. Using cached data where possible."
  }
};
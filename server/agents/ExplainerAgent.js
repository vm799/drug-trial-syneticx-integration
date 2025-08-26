// server/agents/ExplainerAgent.js
class ExplainerAgent {
  constructor(openai) {
    this.openai = openai;
  }

  async explain(query, researchInsights, trialMatches) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an explainer agent for patients and non-experts." },
        {
          role: "user",
          content: `Summarize for a non-technical user. Query: ${query}, Research: ${researchInsights}, Trials: ${trialMatches}`
        }
      ],
      temperature: 0.4,
    });

    return response.choices[0].message.content;
  }
}

export default ExplainerAgent;

// server/agents/TrialMatchingAgent.js
class TrialMatchingAgent {
  constructor(openai) {
    this.openai = openai;
  }

  async match(query, researchInsights) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a clinical trial matching agent." },
        {
          role: "user",
          content: `Given research insights: ${researchInsights}, match trials for: ${query}`
        }
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  }
}

export default TrialMatchingAgent;

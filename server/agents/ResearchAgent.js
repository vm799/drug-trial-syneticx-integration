// server/agents/ResearchAgent.js
class ResearchAgent {
  constructor(openai) {
    this.openai = openai;
  }

  async analyze(query) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a medical research analysis agent." },
        { role: "user", content: `Analyze latest research relevant to: ${query}` }
      ],
      temperature: 0.2,
    });

    return response.choices[0].message.content;
  }
}

export default ResearchAgent;

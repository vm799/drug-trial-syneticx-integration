// server/agents/Coordinator.js
import ResearchAgent from "./ResearchAgent.js";
import TrialMatchingAgent from "./TrialMatchingAgent.js";
import ExplainerAgent from "./ExplainerAgent.js";

class Coordinator {
  constructor(openai) {
    this.openai = openai;
    this.researchAgent = new ResearchAgent(openai);
    this.trialAgent = new TrialMatchingAgent(openai);
    this.explainerAgent = new ExplainerAgent(openai);
  }

  async handleUserQuery(query, context = {}) {
    try {
      // Step 1: Analyze research
      const researchInsights = await this.researchAgent.analyze(query, context);

      // Step 2: Match trials
      const trialMatches = await this.trialAgent.match(query, researchInsights);

      // Step 3: Summarize
      const explanation = await this.explainerAgent.explain(
        query,
        context,        researchInsights,
        trialMatches
      );

      return {
        researchInsights,
        trialMatches,
        explanation,
      };
    } catch (err) {
      console.error("Coordinator Error:", err);
      throw new Error("Agent orchestration failed");
    }
  }
}

export default Coordinator;

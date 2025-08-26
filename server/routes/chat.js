// server/routes/chat.js
import express from "express";
import Coordinator from "../agents/Coordinator.js";
import OpenAI from "openai";

const router = express.Router();

// Lazy initialize OpenAI and coordinator to ensure env vars are loaded
let openai = null;
let coordinator = null;

const initializeAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    coordinator = new Coordinator(openai);
  }
  return coordinator;
};

router.post("/", async (req, res) => {
  try {
    const { query, context } = req.body;
    const coord = initializeAI();
    const results = await coord.handleUserQuery(query, context);
    res.json(results);
  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

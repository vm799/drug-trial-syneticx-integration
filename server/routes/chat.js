// server/routes/chat.js
import express from "express";
import Coordinator from "../agents/Coordinator.js";
import OpenAI from "openai";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const coordinator = new Coordinator(openai);

router.post("/", async (req, res) => {
  try {
    const { query, context } = req.body;
    const results = await coordinator.handleUserQuery(query, context);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

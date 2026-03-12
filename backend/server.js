require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A text message is required." });
  }

  try {
    const ollamaResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: message,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      const errorBody = await ollamaResponse.text();
      throw new Error(`Ollama error ${ollamaResponse.status}: ${errorBody}`);
    }

    const data = await ollamaResponse.json();

    return res.json({
      response: data.response || "No response generated.",
    });
  } catch (error) {
    console.error("Chat API error:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to generate response from Ollama." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Using Ollama model: ${OLLAMA_MODEL}`);
});

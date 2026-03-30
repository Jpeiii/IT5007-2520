require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const SEARCH_WEB_KEY = process.env.SEARCH_WEB_KEY || "";

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

app.post("/api/chat-with-search", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A text message is required." });
  }

  if (!SEARCH_WEB_KEY) {
    return res.status(500).json({ error: "SEARCH_WEB_KEY is not configured." });
  }

  let sources = [];

  try {
    // Step 1: Fetch web search results from Ollama Web Search API (10s timeout)
    const searchAbort = new AbortController();
    const searchTimeout = setTimeout(() => searchAbort.abort(), 10000);

    const searchResponse = await fetch("https://ollama.com/api/web_search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SEARCH_WEB_KEY}`,
      },
      body: JSON.stringify({ query: message, max_results: 5 }),
      signal: searchAbort.signal,
    });
    clearTimeout(searchTimeout);

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      sources = searchData.results || [];
    } else {
      console.warn(
        `Web search returned ${searchResponse.status} — proceeding without search results.`,
      );
    }
  } catch (searchError) {
    console.warn("Web search failed:", searchError.message);
  }

  // Step 2: Build augmented prompt
  let augmentedPrompt = message;
  if (sources.length > 0) {
    const contextBlock = sources
      .map((s, i) => `[${i + 1}] ${s.title}: ${s.content}`)
      .join("\n");
    augmentedPrompt = `Based on the following web search results for "${message}":\n\n${contextBlock}\n\nNow answer the user's question: ${message}`;
  }

  try {
    // Step 3: Send augmented prompt to local Ollama
    const ollamaResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: augmentedPrompt,
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
      sources,
    });
  } catch (error) {
    console.error("Chat-with-search API error:", error.message);
    return res
      .status(500)
      .json({ error: "Failed to generate response from Ollama." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Using Ollama model: ${OLLAMA_MODEL}`);
  console.log(`Web search key: ${SEARCH_WEB_KEY ? "loaded ✓" : "MISSING ✗"}`);
});

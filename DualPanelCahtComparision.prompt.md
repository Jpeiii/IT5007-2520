# Plan: Dual-Panel Chat Comparison with Warm Redesign

**TL;DR:** Add a `/api/chat-with-search` backend endpoint that calls Ollama's own Web Search API to augment prompts, then redesign the frontend as a side-by-side two-panel layout (AI-only vs. AI+Web Search) with a classic warm parchment/coffee aesthetic. One shared input fires both simultaneously.

---

## Phase 1 — Backend: Web Search Endpoint

1. Add `SEARCH_WEB_KEY` to the env vars read in `backend/server.js`
2. Add new `POST /api/chat-with-search` endpoint:
   - Call `POST https://ollama.com/api/web_search` with `Authorization: Bearer ${SEARCH_WEB_KEY}` and body `{ "query": message, "max_results": 5 }`
   - Response gives `{ results: [{ title, url, content }] }`
   - Build augmented prompt: *"Based on these web results: [title]: [content]… Now answer: {message}"*
   - POST augmented prompt to local Ollama (`OLLAMA_URL` / `OLLAMA_MODEL`)
   - Return `{ response, sources: [{title, url, content}] }`
3. Existing `POST /api/chat` untouched — no regression risk

---

## Phase 2 — Frontend: Dual Panel

4. Restructure `frontend/index.html`:
   - Page title: "AI Chat Comparison"
   - `.chat-layout` two-column grid holding two `.panel` cards
   - Left panel: "🤖 AI Chat" → `#chatBoxLeft`
   - Right panel: "🌐 AI + Web Search" → `#chatBoxRight`
   - Single `<form>` at the bottom spanning full width

5. Rewrite `frontend/app.js`:
   - `Promise.all([fetchChat(msg), fetchChatWithSearch(msg)])` — both panels respond in parallel
   - Each panel has its own typing indicator
   - Right panel renders AI response + `<details><summary>Sources (N)</summary>…</details>` with linked entries
   - Submit button disabled until both promises resolve

6. Full redesign of `frontend/styles.css` — **warm/classic palette**:
   - Background: parchment `#FDF6E3`; accents: sienna `#8B5E3C`, amber `#C8963E`, dark coffee `#3E2007`
   - Georgia serif for headers; warm sans-serif for chat body
   - User bubbles: warm coffee gradient; assistant bubbles: cream `#FFF3E0` with amber left border
   - Source entries: small collapsible cards, amber border, monospace URL
   - Responsive — stacks to 1 column at ≤768px

---

## Files to Modify

- `backend/server.js` — add `SEARCH_WEB_KEY`, new `/api/chat-with-search` route
- `frontend/index.html` — two-panel grid layout
- `frontend/app.js` — parallel dual-fetch, source card rendering
- `frontend/styles.css` — full warm/classic redesign

---

## Verification Checklist

1. `node server.js` — confirm both `/api/chat` and `/api/chat-with-search` register
2. Send a query (e.g. "latest news about AI") — both panels show typing indicators simultaneously
3. Left panel: plain Ollama response. Right panel: Ollama response + folded Sources section
4. Expand Sources — verify `N` links with titles and snippets render
5. Narrow browser to ≤768px — panels stack vertically
6. `GET /health` still returns `{ status: "ok" }`

---

## Key Decisions

- `SEARCH_WEB_KEY` is already in `.env` — no new env var needed, just wire it in `server.js`
- Ollama Web Search API: `POST https://ollama.com/api/web_search`, `Authorization: Bearer $key`, returns `{ results: [{title, url, content}] }`
- Sources shown via HTML `<details>` collapse — keeps panel uncluttered
- No changes to existing `/api/chat` endpoint → no regression risk

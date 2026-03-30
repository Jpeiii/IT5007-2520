const form = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatBoxLeft = document.getElementById("chatBoxLeft");
const chatBoxRight = document.getElementById("chatBoxRight");

const API_CHAT = "http://localhost:3001/api/chat";
const API_CHAT_SEARCH = "http://localhost:3001/api/chat-with-search";

// ── Message rendering ──────────────────────────────────────────────

function addMessage(chatBox, text, role) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = text;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addSources(chatBox, sources) {
  if (!sources || sources.length === 0) return;

  const wrapper = document.createElement("div");
  wrapper.className = "sources";

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = `Sources (${sources.length})`;
  details.appendChild(summary);

  sources.forEach((s) => {
    const card = document.createElement("div");
    card.className = "source-card";

    const link = document.createElement("a");
    link.href = s.url;
    link.textContent = s.title || s.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const snippet = document.createElement("p");
    snippet.className = "source-snippet";
    snippet.textContent = s.content || "";

    card.appendChild(link);
    card.appendChild(snippet);
    details.appendChild(card);
  });

  wrapper.appendChild(details);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ── Typing indicator ───────────────────────────────────────────────

function showTyping(chatBox) {
  const indicator = document.createElement("div");
  indicator.className = "message assistant typing";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";
    indicator.appendChild(dot);
  }
  chatBox.appendChild(indicator);
  chatBox.scrollTop = chatBox.scrollHeight;
  return indicator;
}

function hideTyping(indicator) {
  if (indicator) indicator.remove();
}

// ── API calls ──────────────────────────────────────────────────────

async function fetchChat(message) {
  const typing = showTyping(chatBoxLeft);
  try {
    const res = await fetch(API_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    hideTyping(typing);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    addMessage(chatBoxLeft, data.response, "assistant");
  } catch (err) {
    hideTyping(typing);
    addMessage(chatBoxLeft, `Error: ${err.message}`, "assistant error");
  }
}

async function fetchChatWithSearch(message) {
  const typing = showTyping(chatBoxRight);
  try {
    const res = await fetch(API_CHAT_SEARCH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    hideTyping(typing);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    addMessage(chatBoxRight, data.response, "assistant");
    addSources(chatBoxRight, data.sources);
  } catch (err) {
    hideTyping(typing);
    addMessage(chatBoxRight, `Error: ${err.message}`, "assistant error");
  }
}

// ── Form submit ────────────────────────────────────────────────────

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  addMessage(chatBoxLeft, userMessage, "user");
  addMessage(chatBoxRight, userMessage, "user");
  messageInput.value = "";

  sendBtn.disabled = true;

  await Promise.all([fetchChat(userMessage), fetchChatWithSearch(userMessage)]);

  sendBtn.disabled = false;
  messageInput.focus();
});

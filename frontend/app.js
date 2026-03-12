const form = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");

const API_URL = "http://localhost:3001/api/chat";
let typingIndicator = null;

function addMessage(text, role) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = text;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  if (typingIndicator) return;

  const indicator = document.createElement("div");
  indicator.className = "message assistant typing";

  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement("span");
    dot.className = "dot";
    indicator.appendChild(dot);
  }

  chatBox.appendChild(indicator);
  chatBox.scrollTop = chatBox.scrollHeight;
  typingIndicator = indicator;
}

function hideTypingIndicator() {
  if (!typingIndicator) return;
  typingIndicator.remove();
  typingIndicator = null;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, "user");
  messageInput.value = "";

  const submitButton = form.querySelector("button");
  submitButton.disabled = true;
  showTypingIndicator();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    hideTypingIndicator();
    addMessage(data.response, "assistant");
  } catch (error) {
    hideTypingIndicator();
    addMessage(`Error: ${error.message}`, "assistant");
  } finally {
    hideTypingIndicator();
    submitButton.disabled = false;
    messageInput.focus();
  }
});

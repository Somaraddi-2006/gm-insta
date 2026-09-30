requireLogin();

const receiverSelect = document.getElementById("receiverSelect");
const conversationBox = document.getElementById("conversation");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageText");
const activeChatName = document.getElementById("activeChatName");
const chatAvatar = document.getElementById("chatAvatar");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

function formatTime(dateString) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function updateActiveChat() {
  if (!activeChatName || !chatAvatar) return;

  const selectedOption = receiverSelect.options[receiverSelect.selectedIndex];
  const username = selectedOption?.textContent || "Select a user";

  activeChatName.textContent = username;
  chatAvatar.textContent = username.charAt(0).toUpperCase() || "C";
}

async function loadUsers() {
  try {
    const response = await fetch("/api/auth/users", {
      headers: { ...authHeaders() }
    });
    const users = await response.json();

    if (!response.ok) {
      console.error("Could not load users:", users);
      receiverSelect.innerHTML = '<option value="">Could not load users</option>';
      conversationBox.innerHTML = `
        <div class="chat-empty">
          <h3>Users could not be loaded</h3>
          <p>${escapeHtml(users.message || "Please log in again and retry.")}</p>
        </div>
      `;
      updateActiveChat();
      return;
    }

    if (!Array.isArray(users) || users.length === 0) {
      receiverSelect.innerHTML = '<option value="">No other users available</option>';
      conversationBox.innerHTML = `
        <div class="chat-empty">
          <h3>No users found</h3>
          <p>Create or register another account to start messaging.</p>
        </div>
      `;
      updateActiveChat();
      return;
    }

    receiverSelect.innerHTML = users
      .map((u) => `<option value="${u._id}">${escapeHtml(u.username)}</option>`)
      .join("");

    updateActiveChat();
    loadConversation(users[0]._id);
  } catch (error) {
    console.error("User loading failed:", error);
    receiverSelect.innerHTML = '<option value="">Could not load users</option>';
    conversationBox.innerHTML = `
      <div class="chat-empty">
        <h3>Connection problem</h3>
        <p>Unable to load users right now. Please try again.</p>
      </div>
    `;
    updateActiveChat();
  }
}

async function loadConversation(otherUserId) {
  if (!otherUserId) {
    conversationBox.innerHTML = `
      <div class="chat-empty">
        <h3>No conversation selected</h3>
        <p>Choose a user to view messages.</p>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(`/api/chat/conversation/${otherUserId}`, {
      headers: { ...authHeaders() }
    });
    const messages = await response.json();
    const me = getCurrentUser();

    if (!response.ok) {
      console.error("Could not load conversation:", messages);
      conversationBox.innerHTML = `
        <div class="chat-empty">
          <h3>Messages could not be loaded</h3>
          <p>${escapeHtml(messages.message || "Please try again.")}</p>
        </div>
      `;
      return;
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      conversationBox.innerHTML = `
        <div class="chat-empty">
          <h3>Start the conversation</h3>
          <p>Send the first message and it will appear here.</p>
        </div>
      `;
      return;
    }

    conversationBox.innerHTML = messages
      .map((msg) => {
        const isMe = msg.sender?._id === me?._id;
        const who = isMe ? "You" : msg.sender?.username || "User";
        const bubbleClass = isMe ? "sent" : "received";

        return `
          <article class="message-row ${bubbleClass}">
            <div class="message ${bubbleClass}">
              <p class="message-author">${escapeHtml(who)}</p>
              <p class="message-text">${escapeHtml(msg.text)}</p>
              <span class="message-time">${formatTime(msg.createdAt)}</span>
            </div>
          </article>
        `;
      })
      .join("");

    conversationBox.scrollTop = conversationBox.scrollHeight;
  } catch (error) {
    console.error("Conversation loading failed:", error);
    conversationBox.innerHTML = `
      <div class="chat-empty">
        <h3>Connection problem</h3>
        <p>Unable to load this conversation right now.</p>
      </div>
    `;
  }
}

receiverSelect.addEventListener("change", () => {
  updateActiveChat();
  loadConversation(receiverSelect.value);
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const receiverId = receiverSelect.value;
  const text = messageInput.value.trim();

  if (!receiverId || !text) return;

  const response = await fetch("/api/chat/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ receiverId, text })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Message sending failed:", result);
    conversationBox.innerHTML = `
      <div class="chat-empty">
        <h3>Message not sent</h3>
        <p>${escapeHtml(result.message || "Please try again.")}</p>
      </div>
    `;
    return;
  }

  chatForm.reset();
  messageInput.focus();
  loadConversation(receiverId);
});

loadUsers();

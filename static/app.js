const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const connection = document.getElementById("connection");
const statusDot = document.getElementById("statusDot");

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function addMessage(role, text) {
    const welcome = document.querySelector(".welcome");
    if (welcome) welcome.remove();

    const row = document.createElement("div");
    row.className = `message ${role}`;

    row.innerHTML = `
        <div class="avatar">${role === "user" ? "Y" : "U"}</div>
        <div class="bubble">${escapeHtml(text)}</div>
    `;

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
}

function setTyping() {
    const row = document.createElement("div");
    row.id = "typing";
    row.className = "message bot";
    row.innerHTML = `
        <div class="avatar">U</div>
        <div class="bubble typing">UniDot is thinking...</div>
    `;
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
    document.getElementById("typing")?.remove();
}

async function sendMessage(text = null) {
    const message = (text ?? input.value).trim();
    if (!message || send.disabled) return;

    input.value = "";
    input.style.height = "auto";
    send.disabled = true;

    addMessage("user", message);
    setTyping();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message})
        });

        const data = await response.json();
        removeTyping();
        addMessage("bot", data.reply || "I couldn't generate a response.");
    } catch (error) {
        removeTyping();
        addMessage("bot", "The website couldn't reach UniDot.");
    } finally {
        send.disabled = false;
        input.focus();
    }
}

async function updateStatus() {
    try {
        const response = await fetch("/api/status");
        const data = await response.json();

        if (data.local_ai) {
            connection.textContent = "Local AI connected";
            statusDot.classList.add("online");
        } else {
            connection.textContent = "Local AI offline";
            statusDot.classList.remove("online");
        }
    } catch {
        connection.textContent = "UniDot server offline";
        statusDot.classList.remove("online");
    }
}

send.addEventListener("click", () => sendMessage());

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 170) + "px";
});

document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
        sendMessage(button.dataset.prompt);
    });
});

document.getElementById("newChat").addEventListener("click", () => {
    location.reload();
});

document.getElementById("statusBtn").addEventListener("click", async () => {
    const response = await fetch("/api/status");
    const data = await response.json();
    addMessage("bot",
        `UniDot 1.3 status:\n` +
        `Local AI: ${data.local_ai ? "connected" : "offline"}\n` +
        `Memories: ${data.memories}\n` +
        `Knowledge entries: ${data.knowledge}\n` +
        `Conversation messages: ${data.conversation_messages}`
    );
});

document.getElementById("memoryBtn").addEventListener("click", async () => {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: "what do you remember about me"})
    });
    const data = await response.json();
    addMessage("bot", data.reply);
});

document.getElementById("clearMemoryBtn").addEventListener("click", async () => {
    if (!confirm("Clear all saved UniDot memories?")) return;

    await fetch("/api/clear-memory", {
        method: "POST"
    });

    addMessage("bot", "Okay. I've cleared my saved memories.");
});

updateStatus();
setInterval(updateStatus, 10000);

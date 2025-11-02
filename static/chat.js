const API_URL = window.location.origin;
let token = localStorage.getItem('token');
let username = localStorage.getItem('username');
let ws = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!token || !username) {
        window.location.href = '/login';
        return;
    }

    // Display username
    document.getElementById('current-username').textContent = username;

    // Connect WebSocket
    connectWebSocket();

    // Enter key to send message
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

function logout() {
    if (ws) {
        ws.close();
        ws = null;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
}

function connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws?token=${encodeURIComponent(token)}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        displayMessage(message);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showError('Connection error. Please refresh the page.');
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Optionally try to reconnect
    };
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();

    if (!content || !ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }

    const message = {
        type: 'message',
        content: content,
    };

    ws.send(JSON.stringify(message));
    input.value = '';
}

function displayMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    if (message.type === 'system') {
        messageDiv.classList.add('system');
        messageDiv.innerHTML = `<div class="message-content">${escapeHtml(message.content)}</div>`;
    } else {
        const isOwn = message.username === username;
        messageDiv.classList.add(isOwn ? 'own' : 'other');

        const time = new Date(message.time).toLocaleTimeString();
        messageDiv.innerHTML = `
            <div class="message-header">${escapeHtml(message.username)} • ${time}</div>
            <div class="message-content">${escapeHtml(message.content)}</div>
        `;
    }

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    // Simple error display - you can enhance this
    alert(message);
}





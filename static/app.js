const API_URL = window.location.origin;
let token = localStorage.getItem('token');
let username = localStorage.getItem('username');
let ws = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (token && username) {
        showChat();
        connectWebSocket();
    } else {
        showAuth();
    }

    // Form handlers
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Enter key to send message
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
    }
    
    clearError();
}

function showError(message) {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function clearError() {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
}

async function handleLogin(e) {
    e.preventDefault();
    clearError();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Login failed');
            return;
        }
        
        token = data.token;
        username = data.user.username;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        
        showChat();
        connectWebSocket();
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Login error:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    clearError();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Registration failed');
            return;
        }
        
        token = data.token;
        username = data.user.username;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        
        showChat();
        connectWebSocket();
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Register error:', error);
    }
}

function showAuth() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('chat-container').style.display = 'none';
}

function showChat() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('chat-container').style.display = 'block';
    document.getElementById('current-username').textContent = username;
    document.getElementById('messages').innerHTML = '';
}

function logout() {
    if (ws) {
        ws.close();
        ws = null;
    }
    token = null;
    username = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    showAuth();
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


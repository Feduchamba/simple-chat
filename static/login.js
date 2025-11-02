const API_URL = window.location.origin;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/';
        return;
    }

    const form = document.getElementById('login-form');
    form.addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
    e.preventDefault();
    clearError();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showError('Please fill in all fields');
        return;
    }

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

        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);

        // Redirect to chat
        window.location.href = '/';
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Login error:', error);
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function clearError() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
}





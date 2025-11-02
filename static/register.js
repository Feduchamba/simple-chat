const API_URL = window.location.origin;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/';
        return;
    }

    const form = document.getElementById('register-form');
    form.addEventListener('submit', handleRegister);
});

async function handleRegister(e) {
    e.preventDefault();
    clearError();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validation
    if (!username || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

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

        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);

        // Redirect to chat
        window.location.href = '/';
    } catch (error) {
        showError('Network error. Please try again.');
        console.error('Register error:', error);
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





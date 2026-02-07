const AUTH_URL = 'http://127.0.0.1:3000/auth';
const token = localStorage.getItem('token');
const form = document.getElementById('profile-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageDiv = document.getElementById('message');

// specific logical redirection if not logged in
if (!token) {
    window.location.href = 'todo.html';
}

// Fetch current data
async function fetchProfile() {
    try {
        const response = await fetch(`${AUTH_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.user) {
            usernameInput.value = data.user.username;
            emailInput.value = data.user.email;
        } else {
            // Token likely expired
            logout();
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// Update profile
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageDiv.textContent = 'Saving...';
    messageDiv.className = 'message';

    const updates = {
        username: usernameInput.value,
        email: emailInput.value
    };

    if (passwordInput.value) {
        updates.password = passwordInput.value;
    }

    try {
        const response = await fetch(`${AUTH_URL}/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.textContent = 'Profile updated successfully!';
            messageDiv.classList.add('success');
            passwordInput.value = ''; // Clear password field
        } else {
            messageDiv.textContent = data.error || 'Failed to update profile';
            messageDiv.classList.add('error');
        }
    } catch (error) {
        messageDiv.textContent = 'Connection error';
        messageDiv.classList.add('error');
    }
});

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'todo.html';
}

// Init
fetchProfile();

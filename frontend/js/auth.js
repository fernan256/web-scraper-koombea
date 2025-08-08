if (localStorage.getItem('token')) {
    window.location.href = 'index.html';
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');
        
        errorDiv.textContent = '';
        
        try {
            const response = await authAPI.login(username, password);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            window.location.href = 'index.html';
        } catch (error) {
            errorDiv.textContent = error.message;
        }
    });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('error-message');
        
        errorDiv.textContent = '';
        
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters long';
            return;
        }
        
        if (username.length < 3 || username.length > 50) {
            errorDiv.textContent = 'Username must be between 3 and 50 characters';
            return;
        }
        
        if (!email || email.length < 3 || email.length > 50) {
            errorDiv.textContent = 'Email must be between 3 and 50 characters';
            return;
        }
        
        try {
            const response = await authAPI.register(username, email, password);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            window.location.href = 'index.html';
        } catch (error) {
            errorDiv.textContent = error.message;
        }
    });
}

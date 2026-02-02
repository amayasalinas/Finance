document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Credentials (Hardcoded as requested)
    const VALID_USER = 'Amorcito1424';
    const VALID_PASS = 'Sebastian2Isa97';

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === VALID_USER && password === VALID_PASS) {
                // Successful login
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = 'index.html';
            } else {
                // Failed login
                errorMessage.style.display = 'block';
            }
        });
    }

    // Check auth status (for index.html usage) if this script is included there
    // But index.html will handle its own redirect logic inline to be faster
});

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

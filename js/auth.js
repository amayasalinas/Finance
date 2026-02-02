// =========================================
// AUTH - Finanzas Familiares
// =========================================

// Valid credentials for local testing
const VALID_USERS = [
    { username: 'familia', password: 'familia123' },
    { username: 'admin', password: 'admin' },
    { username: 'papa', password: 'papa123' },
    { username: 'mama', password: 'mama123' }
];

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Get current user
function getCurrentUser() {
    return localStorage.getItem('currentUser') || 'Familia';
}

// Login function
function login(username, password) {
    const user = VALID_USERS.find(u =>
        (u.username === username || u.username === username.toLowerCase()) &&
        u.password === password
    );

    if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', user.username);
        return true;
    }
    return false;
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    showLogin();
}

// Show login view
function showLogin() {
    const loginView = document.getElementById('view-login');
    const appContainer = document.getElementById('app-container');

    if (loginView) {
        loginView.classList.add('active');
        loginView.style.display = 'block'; // Fallback
    }
    if (appContainer) {
        appContainer.classList.remove('active');
        appContainer.style.display = 'none'; // Fallback
    }
    console.log('🔐 Showing login view');
}

// Show app (after successful login)
function showApp() {
    const loginView = document.getElementById('view-login');
    const appContainer = document.getElementById('app-container');

    if (loginView) {
        loginView.classList.remove('active');
        loginView.style.display = 'none'; // Fallback
    }
    if (appContainer) {
        appContainer.classList.add('active');
        appContainer.style.display = 'block'; // Fallback
    }
    console.log('🏠 Showing app dashboard');
}

// Setup auth event handlers
function setupAuth() {
    console.log('⚙️ Setting up auth handlers...');

    // Check login state
    if (isLoggedIn()) {
        showApp();
        // Initialize app after showing
        if (typeof initApp === 'function') {
            initApp();
        }
    } else {
        showLogin();
    }

    // Setup login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form handler attached');
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
        console.log('✅ Logout button handler attached');
    }

    // Setup password toggle
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('login-pass');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.querySelector('.material-symbols-outlined').textContent =
                type === 'password' ? 'visibility_off' : 'visibility';
        });
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    console.log('🔑 Login attempt...');

    const username = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');

    if (!username || !password) {
        showError(errorEl, 'Por favor ingresa usuario y contraseña');
        return;
    }

    if (login(username, password)) {
        console.log('✅ Login successful!');
        showApp();
        // Initialize app after login
        if (typeof initApp === 'function') {
            initApp();
        }
    } else {
        console.log('❌ Login failed');
        showError(errorEl, 'Usuario o contraseña incorrectos');
    }
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
        setTimeout(() => {
            element.classList.add('hidden');
        }, 3000);
    }
}

// Initialize auth on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Ready - Initializing auth...');
    setupAuth();
});

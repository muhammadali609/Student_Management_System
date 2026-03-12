// App State 
const AppState = {
    user: null, // e.g. { name: 'Ali', role: 'Student' }
    token: null,
    apiUrl: 'http://localhost:5000/api' // Default API URL
};

// Router placeholder
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    renderNav();
    if(AppState.user) {
        renderDashboard();
    } else {
        renderLogin();
    }
}

function renderNav() {
    const nav = document.getElementById('nav-links');
    if(!AppState.user) {
        nav.innerHTML = `
            <li class="nav-item"><a class="nav-link active" href="#" onclick="renderLogin()">Login</a></li>
        `;
    } else {
        nav.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="#" onclick="renderDashboard()">Dashboard</a></li>
            <li class="nav-item"><a class="nav-link text-danger" href="#" onclick="logout()">Logout (${AppState.user.name})</a></li>
        `;
    }
}

function renderLogin() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="row justify-content-center fade-in">
            <div class="col-md-5">
                <div class="card p-4">
                    <h2 class="text-center mb-4">Welcome to SPMIS</h2>
                    <form onsubmit="handleLogin(event)">
                        <div class="mb-3">
                            <label class="form-label">Email address</label>
                            <input type="email" class="form-control" id="emailInput" required value="student@university.edu">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" id="passInput" required value="password">
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Login</button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passInput').value;
    
    try {
        const response = await fetch(`${AppState.apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            AppState.user = data;
            initApp();
        } else {
            const err = await response.json();
            alert(err.message || 'Login failed');
        }
    } catch (error) {
        alert('Server unreachable. Please ensure Backend API is running.');
    }
}

function logout() {
    AppState.user = null;
    initApp();
}

function renderDashboard() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="fade-in">
            <h2>Dashboard</h2>
            <p class="text-muted">Welcome back, ${AppState.user.name}! Role: ${AppState.user.role}</p>
            <div class="row mt-4">
                <div class="col-md-4">
                    <div class="card p-4 text-center bg-white">
                        <h4>Pending Tasks</h4>
                        <h1 class="text-primary mt-2">0</h1>
                    </div>
                </div>
            </div>
        </div>
    `;
}

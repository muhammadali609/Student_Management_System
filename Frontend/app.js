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
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>🎓 Student Project Management Dashboard</h2>
                <span class="badge bg-primary fs-6">${AppState.user.role}</span>
            </div>
            
            <p class="text-muted">Welcome back, <strong>${AppState.user.name}</strong>! Here is an overview of your academic project activity.</p>
            
            <div class="row mt-4">
                <div class="col-md-4 mb-4">
                    <div class="card p-4 text-center h-100 border-primary border-top border-4">
                        <h5 class="text-muted">Pending Tasks</h5>
                        <h1 class="text-primary mt-3 mb-0">3</h1>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card p-4 text-center h-100 border-success border-top border-4">
                        <h5 class="text-muted">Completed Milestones</h5>
                        <h1 class="text-success mt-3 mb-0">5</h1>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card p-4 text-center h-100 border-warning border-top border-4">
                        <h5 class="text-muted">Weekly Reports Submitted</h5>
                        <h1 class="text-warning mt-3 mb-0">2</h1>
                    </div>
                </div>
            </div>

            <div class="card p-4 mt-2">
                <h4>Recent Activity</h4>
                <ul class="list-group list-group-flush mt-3">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Task "Design UI Mockup" marked as Completed
                        <span class="badge bg-success rounded-pill">Done</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Supervisor approved project proposal
                        <span class="badge bg-primary rounded-pill">Approved</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        System automatically generated weekly progress report
                        <span class="badge bg-secondary rounded-pill">System</span>
                    </li>
                </ul>
            </div>
        </div>
    `;
}

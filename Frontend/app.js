// App State 
const AppState = {
    user: null, 
    token: null,
    apiUrl: 'http://localhost:5000/api'
};

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
            <li class="nav-item"><a class="nav-link" href="#" onclick="renderProjects()">Projects</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="renderTasks()">Tasks</a></li>
            <li class="nav-item"><a class="nav-link" href="#" onclick="renderReports()">Weekly Reports</a></li>
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
                            <input type="email" class="form-control" id="emailInput" required value="student@spmis.edu">
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
            
            <p class="text-muted">Welcome back, <strong>${AppState.user.name}</strong>! Navigate using the top menu to access your features.</p>
            
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
        </div>
    `;
}

function renderProjects() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="fade-in">
            <h2>📝 Project Proposal Submission</h2>
            <div class="card p-4 mt-3">
                <form onsubmit="event.preventDefault(); alert('Proposal Submitted Successfully!'); renderDashboard();">
                    <div class="mb-3">
                        <label class="form-label">Project Title</label>
                        <input type="text" class="form-control" required placeholder="Enter project title">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Project Abstract</label>
                        <textarea class="form-control" rows="4" required placeholder="Describe your project..."></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Add Group Members (Comma separated IDs)</label>
                        <input type="text" class="form-control" placeholder="E.g. Student1, Student2">
                    </div>
                    <button type="submit" class="btn btn-primary">Submit Proposal</button>
                </form>
            </div>
        </div>
    `;
}

function renderTasks() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="fade-in">
            <div class="d-flex justify-content-between">
                <h2>📋 Task Board</h2>
                <button class="btn btn-success" onclick="alert('Task Modal Opened')">+ New Task</button>
            </div>
            <div class="row mt-4">
                <div class="col-md-4">
                    <div class="card bg-light p-3">
                        <h5 class="text-muted">To Do</h5>
                        <div class="card mt-2 p-2 shadow-sm">Design Database Schema</div>
                        <div class="card mt-2 p-2 shadow-sm">Write Backend API</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light p-3">
                        <h5 class="text-muted">In Progress</h5>
                        <div class="card mt-2 p-2 shadow-sm border-primary border-start border-4">Integrate Frontend logic</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light p-3">
                        <h5 class="text-muted">Done</h5>
                        <div class="card mt-2 p-2 shadow-sm border-success border-start border-4">System Requirements Specification</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderReports() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="fade-in">
            <h2>📅 Weekly Reporting</h2>
            <div class="card p-4 mt-3">
                <form onsubmit="event.preventDefault(); alert('Weekly Report Submitted!'); renderDashboard();">
                    <div class="mb-3">
                        <label class="form-label">Week Number</label>
                        <input type="number" class="form-control" required value="13">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Progress Summary</label>
                        <textarea class="form-control" rows="4" required placeholder="What did you implement this week?"></textarea>
                    </div>
                    <button type="submit" class="btn btn-warning">Submit Report to Supervisor</button>
                </form>
            </div>
        </div>
    `;
}

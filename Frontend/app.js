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
        if(AppState.user.role === 'Admin') {
            renderAdminDashboard();
        } else {
            renderDashboard();
        }
    } else {
        renderLogin();
    }
}

function renderNav() {
    const nav = document.getElementById('nav-links');
    if(!AppState.user) {
        nav.innerHTML = `
            <li class="nav-item"><a class="nav-link active" href="#" onclick="renderLogin()">Login / Register</a></li>
        `;
    } else {
        let links = `<li class="nav-item"><a class="nav-link" href="#" onclick="initApp()">Dashboard</a></li>`;
        
        if (AppState.user.role === 'Student') {
            links += `
                <li class="nav-item"><a class="nav-link" href="#" onclick="renderProjects()">Submit Proposal</a></li>
                <li class="nav-item"><a class="nav-link" href="#" onclick="renderTasks()">Tasks Board</a></li>
                <li class="nav-item"><a class="nav-link" href="#" onclick="renderReports()">Submit Weekly Report</a></li>
            `;
        } else if (AppState.user.role === 'Admin') {
            links += `
                <li class="nav-item"><a class="nav-link" href="#" onclick="renderAdminDashboard()">System Admin</a></li>
            `;
        } else if (AppState.user.role === 'Supervisor') {
            links += `
                <li class="nav-item"><a class="nav-link" href="#" onclick="alert('Supervisor Panel: Coming Soon')">My Students</a></li>
            `;
        }

        links += `<li class="nav-item"><a class="nav-link text-danger fw-bold" href="#" onclick="logout()">Logout (${AppState.user.name})</a></li>`;
        nav.innerHTML = links;
    }
}

function renderLogin() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="row justify-content-center fade-in mt-4">
            <div class="col-md-5">
                <div class="card p-4 mb-4 shadow-sm">
                    <h3 class="text-center mb-4 text-primary">Login to SPMIS</h3>
                    <form onsubmit="handleLogin(event)">
                        <div class="mb-3">
                            <label class="form-label">Email address</label>
                            <input type="email" class="form-control" id="loginEmail" required value="student@spmis.edu">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" id="loginPass" required value="password">
                        </div>
                        <button type="submit" class="btn btn-primary w-100 fw-bold">Login</button>
                    </form>
                </div>

                <div class="card p-4 shadow-sm border-success">
                    <h4 class="text-center mb-4 text-success">Create New Account</h4>
                    <form onsubmit="handleRegister(event)">
                        <div class="mb-3">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-control" id="regName" required placeholder="John Doe">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email address</label>
                            <input type="email" class="form-control" id="regEmail" required placeholder="john@spmis.edu">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" id="regPass" required placeholder="Select a password">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Account Role</label>
                            <select class="form-select" id="regRole">
                                <option value="Student">Student</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-success w-100 fw-bold">Register Account</button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    
    try {
        const response = await fetch(`${AppState.apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            AppState.user = await response.json();
            initApp();
        } else {
            const err = await response.json();
            alert(err.message || 'Login failed');
        }
    } catch (error) {
        alert('Server unreachable. Please ensure Backend API is running.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const role = document.getElementById('regRole').value;

    try {
        const response = await fetch(`${AppState.apiUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password, role })
        });

        if (response.ok) {
            alert('Registration Successful! You may now login via the top box.');
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPass').value = password;
        } else {
            const err = await response.json();
            alert('Error: ' + err.message);
        }
    } catch (error) {
        alert('Server unreachable. Is the backend running?');
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
                <h2>🎓 Student Dashboard</h2>
                <span class="badge bg-primary fs-6">${AppState.user.role}</span>
            </div>
            
            <p class="text-muted">Welcome back, <strong>${AppState.user.name}</strong>! Use the top menu to access your features.</p>
            
            <div class="row mt-4">
                <div class="col-md-4 mb-4">
                    <div class="card p-4 text-center h-100 border-primary border-top border-4">
                        <h5 class="text-muted">Pending Tasks</h5>
                        <h1 class="text-primary mt-3 mb-0" id="dashTasks">0</h1>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card p-4 text-center h-100 border-success border-top border-4">
                        <h5 class="text-muted">Completed Milestones</h5>
                        <h1 class="text-success mt-3 mb-0">0</h1>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card p-4 text-center h-100 border-warning border-top border-4">
                        <h5 class="text-muted">Weekly Reports Submitted</h5>
                        <h1 class="text-warning mt-3 mb-0" id="dashReports">0</h1>
                    </div>
                </div>
            </div>
        </div>
    `;
    loadStudentStats();
}

async function loadStudentStats() {
    // In a real scenario we use Project ID. Here we mock ID=1 for simplicity.
    try {
        const tReq = await fetch(`${AppState.apiUrl}/tasks/1`);
        if(tReq.ok) {
            const tasks = await tReq.json();
            document.getElementById('dashTasks').innerText = tasks.length;
        }
        const rReq = await fetch(`${AppState.apiUrl}/reports/1`);
        if(rReq.ok) {
            const reports = await rReq.json();
            document.getElementById('dashReports').innerText = reports.length;
        }
    } catch (error) { console.error(error); }
}

function renderAdminDashboard() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="fade-in">
            <h2>🛡️ Admin Control Panel</h2>
            <p class="text-muted">System Management & Approvals</p>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card p-4 shadow-sm">
                        <h4 class="mb-4">Pending Project Proposals</h4>
                        <div id="adminProjectList" class="list-group">
                            <p>Loading projects from Database...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    fetchAdminProjects();
}

async function fetchAdminProjects() {
    try {
        const response = await fetch(`${AppState.apiUrl}/projects`);
        if(response.ok) {
            const projects = await response.json();
            const list = document.getElementById('adminProjectList');
            if(projects.length === 0) {
                list.innerHTML = `<p class="text-muted">No projects found in the system right now.</p>`;
                return;
            }
            list.innerHTML = projects.map(p => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${p.title}</strong><br>
                        <small class="text-muted">${p.abstract}</small>
                    </div>
                    <div>
                        <span class="badge ${p.status === 'Approved' ? 'bg-success' : 'bg-secondary'} me-3">${p.status || 'Pending'}</span>
                        <button class="btn btn-sm btn-outline-success" onclick="updateProjectStatus(${p.id}, 'Approved')">Approve</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        document.getElementById('adminProjectList').innerText = 'Backend connection error.';
    }
}

async function updateProjectStatus(id, newStatus) {
    await fetch(`${AppState.apiUrl}/projects/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus)
    });
    fetchAdminProjects();
}

function renderProjects() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="fade-in">
            <h2>📝 Project Proposal Submission</h2>
            <div class="card p-4 mt-3 shadow-sm border-start border-primary border-4">
                <form id="submissionForm" onsubmit="handleProposalSubmit(event)">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Project Title</label>
                        <input id="propTitle" type="text" class="form-control" required placeholder="Enter project title">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Project Abstract</label>
                        <textarea id="propAbs" class="form-control" rows="4" required placeholder="Describe your project..."></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Add Group Members (Separated by comma)</label>
                        <input id="propTeam" type="text" class="form-control" placeholder="E.g. Ali, John, Sara">
                    </div>
                    <button type="submit" class="btn btn-primary fw-bold px-4">Submit Proposal</button>
                </form>
            </div>
        </div>
    `;
}

async function handleProposalSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('propTitle').value;
    const abstract = document.getElementById('propAbs').value;
    const studentIds = document.getElementById('propTeam').value;

    await fetch(`${AppState.apiUrl}/projects/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, abstract, studentIds, status: 'Pending' })
    });
    alert('Project Proposal submitted to the system securely! Admin can now view it.');
    initApp();
}

function renderTasks() {
    const content = document.getElementById('app-content');
    // Basic Task interface linking dynamic memory
    content.innerHTML = `
        <div class="fade-in">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>📋 Central Task Board</h2>
            </div>
            
            <div class="card p-3 mb-4 shadow-sm bg-light">
                <form class="d-flex" onsubmit="handleAddTask(event)">
                    <input type="text" id="newTaskTitle" class="form-control me-2" placeholder="What needs to be done?" required>
                    <button type="submit" class="btn btn-success fw-bold text-nowrap">+ Add Task</button>
                </form>
            </div>

            <div class="row">
                <div class="col-md-12">
                     <div class="card shadow-sm p-4">
                        <h5>Your Project Backlog</h5>
                        <div id="dynamicTasksList" class="mt-3">
                            Loading tasks from Database...
                        </div>
                     </div>
                </div>
            </div>
        </div>
    `;
    loadTasksUI();
}

async function handleAddTask(e) {
    e.preventDefault();
    const title = document.getElementById('newTaskTitle').value;
    await fetch(`${AppState.apiUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Hardcoding standard project ID 1 for demonstration logic
        body: JSON.stringify({ projectId: 1, title: title, description: 'Created on UI', status: 'To Do', assignedTo: AppState.user.name })
    });
    renderTasks();
}

async function loadTasksUI() {
    try {
        const req = await fetch(`${AppState.apiUrl}/tasks/1`);
        const list = document.getElementById('dynamicTasksList');
        if(req.ok) {
            const tasks = await req.json();
            if (tasks.length === 0) {
                list.innerHTML = `<p class="text-muted">No tasks currently added. Use the bar above to create one.</p>`;
                return;
            }
            list.innerHTML = tasks.map(t => `
                <div class="alert alert-secondary d-flex justify-content-between align-items-center shadow-sm">
                    <div>
                        <strong>${t.title}</strong> <span class="badge bg-info ms-2">${t.assignedTo}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch {
        document.getElementById('dynamicTasksList').innerText = "Database connection error.";
    }
}

function renderReports() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="fade-in">
            <h2>📅 Weekly Reporting</h2>
            <div class="card p-4 mt-3 shadow-sm border-start border-warning border-4">
                <form onsubmit="handleReportSubmit(event)">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Week Number</label>
                        <input id="repWeek" type="number" class="form-control" required value="13">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-bold">Progress Summary</label>
                        <textarea id="repProg" class="form-control" rows="4" required placeholder="What milestones did you implement this week?"></textarea>
                    </div>
                    <button type="submit" class="btn btn-warning fw-bold px-4">Submit Report to Supervisor</button>
                </form>
            </div>
        </div>
    `;
}

async function handleReportSubmit(e) {
    e.preventDefault();
    const weekNumber = document.getElementById('repWeek').value;
    const progressText = document.getElementById('repProg').value;

    await fetch(`${AppState.apiUrl}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 1, weekNumber: weekNumber, progressText: progressText })
    });
    alert('Weekly Report securely logged to database!');
    initApp();
}

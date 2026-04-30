const AppState = {
    user: null,
    apiUrl: 'http://localhost:5000/api',
    projects: [],
    selectedProjectId: null
};

const states = {
    draft: 'Draft',
    submitted: 'Proposal Submitted',
    approved: 'Approved',
    inProgress: 'In Progress',
    review: 'Under Review',
    completed: 'Completed',
    archived: 'Archived',
    rejected: 'Rejected'
};

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    renderNav();
    if (!AppState.user) return renderLogin();
    if (AppState.user.role === 'Student') return renderStudentDashboard();
    if (AppState.user.role === 'Supervisor') return renderSupervisorDashboard();
    return renderAdminDashboard();
}

function renderNav() {
    const nav = document.getElementById('nav-links');
    if (!AppState.user) {
        nav.innerHTML = `<li class="nav-item"><a class="nav-link active" href="#" onclick="renderLogin()">Login / Register</a></li>`;
        return;
    }

    let links = `<li class="nav-item"><a class="nav-link" href="#" onclick="initApp()">Dashboard</a></li>`;
    if (AppState.user.role === 'Student') {
        links += `<li class="nav-item"><a class="nav-link" href="#" onclick="renderStudentDashboard()">My Workflow</a></li>`;
    } else if (AppState.user.role === 'Supervisor') {
        links += `<li class="nav-item"><a class="nav-link" href="#" onclick="renderSupervisorDashboard()">Review Center</a></li>`;
    } else {
        links += `<li class="nav-item"><a class="nav-link" href="#" onclick="renderAdminDashboard()">Operations</a></li>`;
    }
    links += `<li class="nav-item"><a class="nav-link text-danger fw-bold" href="#" onclick="logout()">Logout (${AppState.user.name})</a></li>`;
    nav.innerHTML = links;
}

function renderLogin() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
        <div class="row justify-content-center fade-in mt-4">
            <div class="col-md-5">
                <div class="card p-4 mb-4 shadow-sm">
                    <h3 class="text-center mb-4 text-primary">Login to SPMIS</h3>
                    <form onsubmit="handleLogin(event)">
                        <div class="mb-3"><label class="form-label">Email</label><input type="email" class="form-control" id="loginEmail" required value="student@spmis.edu"></div>
                        <div class="mb-3"><label class="form-label">Password</label><input type="password" class="form-control" id="loginPass" required value="password"></div>
                        <button type="submit" class="btn btn-primary w-100 fw-bold">Login</button>
                    </form>
                </div>
                <div class="card p-4 shadow-sm border-success">
                    <h4 class="text-center mb-4 text-success">Create New Account</h4>
                    <form onsubmit="handleRegister(event)">
                        <div class="mb-3"><label class="form-label">Full Name</label><input type="text" class="form-control" id="regName" required></div>
                        <div class="mb-3"><label class="form-label">Email</label><input type="email" class="form-control" id="regEmail" required></div>
                        <div class="mb-3"><label class="form-label">Password</label><input type="password" class="form-control" id="regPass" required></div>
                        <div class="mb-3"><label class="form-label">Role</label><select class="form-select" id="regRole"><option value="Student">Student</option><option value="Supervisor">Supervisor</option><option value="Admin">Admin</option></select></div>
                        <button type="submit" class="btn btn-success w-100 fw-bold">Register</button>
                    </form>
                </div>
            </div>
        </div>`;
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    const response = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    if (!response.ok) return alert(response.message || 'Login failed.');
    AppState.user = response.data;
    await refreshProjects();
    initApp();
}

async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const role = document.getElementById('regRole').value;
    const response = await apiFetch('/auth/register', { method: 'POST', body: { fullName, email, password, role } });
    alert(response.ok ? 'Registration successful. Please login.' : (response.message || 'Registration failed.'));
}

function logout() {
    AppState.user = null;
    AppState.projects = [];
    AppState.selectedProjectId = null;
    initApp();
}

async function refreshProjects() {
    const query = `?userId=${AppState.user.id}&role=${encodeURIComponent(AppState.user.role)}`;
    const response = await apiFetch(`/projects${query}`);
    AppState.projects = response.ok ? response.data : [];
    if (!AppState.selectedProjectId && AppState.projects.length > 0) {
        AppState.selectedProjectId = AppState.projects[0].id;
    }
}

function getSelectedProject() {
    return AppState.projects.find(p => p.id === AppState.selectedProjectId) || null;
}

function statusBadge(status) {
    const classes = {
        [states.draft]: 'bg-secondary',
        [states.submitted]: 'bg-primary',
        [states.approved]: 'bg-success',
        [states.inProgress]: 'bg-warning text-dark',
        [states.review]: 'bg-info text-dark',
        [states.completed]: 'bg-success',
        [states.archived]: 'bg-dark',
        [states.rejected]: 'bg-danger'
    };
    return `<span class="badge ${classes[status] || 'bg-secondary'}">${status || 'N/A'}</span>`;
}

function studentNextAction(project) {
    if (!project) return 'Create your first project draft.';
    if (project.status === states.draft || project.status === states.rejected) return 'Submit your proposal for supervisor review.';
    if (project.status === states.submitted) return 'Waiting for supervisor decision.';
    if (project.status === states.approved || project.status === states.inProgress) return 'Work on tasks and submit weekly reports.';
    if (project.status === states.review) return 'Final submission is under supervisor review.';
    if (project.status === states.completed) return 'Project completed. Waiting for archival.';
    return 'Project archived.';
}

async function renderStudentDashboard() {
    await refreshProjects();
    const content = document.getElementById('app-content');
    const project = getSelectedProject();
    content.innerHTML = `
        <div class="fade-in">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>Student Workflow</h2>
                <span class="badge bg-primary">${AppState.user.role}</span>
            </div>
            <p class="text-muted">Next action: <strong>${studentNextAction(project)}</strong></p>
            <div class="card p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">My Projects</h5>
                    <button class="btn btn-sm btn-outline-primary" onclick="renderCreateProject()">+ Create Project</button>
                </div>
                <div id="projectPicker" class="mt-3"></div>
            </div>
            <div id="studentActions"></div>
        </div>`;

    renderProjectPicker();
    renderStudentActions();
}

function renderProjectPicker() {
    const container = document.getElementById('projectPicker');
    if (!container) return;
    if (AppState.projects.length === 0) {
        container.innerHTML = `<p class="text-muted mb-0">No projects yet. Create a draft to start your workflow.</p>`;
        return;
    }
    container.innerHTML = AppState.projects.map(p => `
        <button class="btn ${p.id === AppState.selectedProjectId ? 'btn-primary' : 'btn-outline-secondary'} btn-sm me-2 mb-2" onclick="selectProject(${p.id})">
            ${p.title} ${statusBadge(p.status)}
        </button>`).join('');
}

function selectProject(id) {
    AppState.selectedProjectId = id;
    renderStudentDashboard();
}

function renderStudentActions() {
    const project = getSelectedProject();
    const panel = document.getElementById('studentActions');
    if (!panel) return;
    if (!project) {
        panel.innerHTML = '';
        return;
    }

    const canSubmitProposal = project.status === states.draft || project.status === states.rejected;
    const canWork = project.status === states.approved || project.status === states.inProgress;
    const canFinalSubmit = project.status === states.inProgress;

    panel.innerHTML = `
        <div class="card p-4 mb-3">
            <h5>${project.title}</h5>
            <p class="text-muted">${project.abstract}</p>
            <p>Status: ${statusBadge(project.status)}</p>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-primary" ${canSubmitProposal ? '' : 'disabled'} onclick="submitProposal(${project.id})">Submit Proposal</button>
                <button class="btn btn-outline-success" ${canWork ? '' : 'disabled'} onclick="renderTasks(${project.id})">Tasks</button>
                <button class="btn btn-outline-warning" ${canWork ? '' : 'disabled'} onclick="renderReports(${project.id})">Weekly Reports</button>
                <button class="btn btn-dark" ${canFinalSubmit ? '' : 'disabled'} onclick="finalSubmit(${project.id})">Final Submit</button>
            </div>
        </div>`;
}

function renderCreateProject() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="fade-in">
        <h2>Create Project Draft</h2>
        <div class="card p-4 mt-3">
          <form onsubmit="createProject(event)">
            <div class="mb-3"><label class="form-label">Title</label><input id="propTitle" class="form-control" required></div>
            <div class="mb-3"><label class="form-label">Abstract</label><textarea id="propAbs" class="form-control" rows="3" required></textarea></div>
            <div class="mb-3"><label class="form-label">Group Member IDs (comma-separated)</label><input id="propTeam" class="form-control" value="${AppState.user.id}"></div>
            <button class="btn btn-primary" type="submit">Save Draft</button>
            <button class="btn btn-link" type="button" onclick="renderStudentDashboard()">Back</button>
          </form>
        </div>
      </div>`;
}

async function createProject(e) {
    e.preventDefault();
    const body = {
        title: document.getElementById('propTitle').value,
        abstract: document.getElementById('propAbs').value,
        studentIds: document.getElementById('propTeam').value
    };
    const response = await apiFetch('/projects/register', { method: 'POST', body });
    if (!response.ok) return alert(response.message || 'Unable to create project.');
    AppState.selectedProjectId = response.data.id;
    await renderStudentDashboard();
}

async function submitProposal(projectId) {
    const response = await apiFetch(`/projects/${projectId}/submit-proposal`, { method: 'POST' });
    if (!response.ok) return alert(response.message || 'Proposal submission failed.');
    await renderStudentDashboard();
}

async function finalSubmit(projectId) {
    const response = await apiFetch(`/projects/${projectId}/final-submit`, { method: 'POST' });
    if (!response.ok) return alert(response.message || 'Final submission failed.');
    await renderStudentDashboard();
}

async function renderTasks(projectId) {
    const content = document.getElementById('app-content');
    const tasksResponse = await apiFetch(`/tasks/${projectId}`);
    const tasks = tasksResponse.ok ? tasksResponse.data : [];
    content.innerHTML = `
      <div class="fade-in">
        <h2>Task Board</h2>
        <p class="text-muted">Project ID: ${projectId}</p>
        ${AppState.user.role === 'Supervisor' ? `
          <div class="card p-3 mb-3">
            <form class="d-flex gap-2" onsubmit="createTask(event, ${projectId})">
              <input id="taskTitle" class="form-control" placeholder="Task title" required>
              <button class="btn btn-success">Assign Task</button>
            </form>
          </div>` : ''}
        <div class="card p-3">
          ${tasks.length === 0 ? '<p class="text-muted mb-0">No tasks yet.</p>' : tasks.map(t => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
              <div><strong>${t.title}</strong> <small class="text-muted">(${t.assignedTo})</small></div>
              <div>
                ${statusBadge(t.status)}
                ${(AppState.user.role === 'Student' || AppState.user.role === 'Supervisor') ? `
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="updateTaskStatus(${t.id}, 'In Progress', ${projectId})">Start</button>
                <button class="btn btn-sm btn-outline-success ms-1" onclick="updateTaskStatus(${t.id}, 'Done', ${projectId})">Done</button>` : ''}
              </div>
            </div>`).join('')}
        </div>
        <button class="btn btn-link mt-3" onclick="${AppState.user.role === 'Supervisor' ? 'renderSupervisorDashboard()' : 'renderStudentDashboard()'}">Back</button>
      </div>`;
}

async function createTask(e, projectId) {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const response = await apiFetch('/tasks', {
        method: 'POST',
        body: { projectId, title, description: 'Assigned through supervisor board', assignedTo: 'Student Team' }
    });
    if (!response.ok) return alert(response.message || 'Task creation failed.');
    await renderTasks(projectId);
}

async function updateTaskStatus(taskId, status, projectId) {
    const response = await apiFetch(`/tasks/${taskId}`, { method: 'PUT', body: { status } });
    if (!response.ok) return alert(response.message || 'Task update failed.');
    await renderTasks(projectId);
}

async function renderReports(projectId) {
    const listResponse = await apiFetch(`/reports/${projectId}`);
    const reports = listResponse.ok ? listResponse.data : [];
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="fade-in">
        <h2>Weekly Reports</h2>
        <div class="card p-3 mb-3">
          ${AppState.user.role === 'Student' ? `
            <form onsubmit="submitReport(event, ${projectId})">
              <div class="mb-2"><input id="weekNo" type="number" min="1" class="form-control" placeholder="Week number" required></div>
              <div class="mb-2"><textarea id="progressText" class="form-control" rows="3" placeholder="Progress summary" required></textarea></div>
              <button class="btn btn-warning">Submit Weekly Report</button>
            </form>` : '<p class="mb-0 text-muted">Supervisor can review and comment below.</p>'}
        </div>
        <div class="card p-3">
          ${reports.length === 0 ? '<p class="text-muted mb-0">No reports submitted yet.</p>' : reports.map(r => `
            <div class="border-bottom py-2">
              <strong>Week ${r.weekNumber}</strong>
              <p class="mb-1">${r.progressText}</p>
              <p class="mb-1"><small>Feedback: ${r.supervisorFeedback || 'Pending'}</small></p>
              ${AppState.user.role === 'Supervisor' ? `
                <form class="d-flex gap-2" onsubmit="submitFeedback(event, ${r.id}, ${projectId})">
                  <input id="fb-${r.id}" class="form-control form-control-sm" placeholder="Add feedback" required>
                  <button class="btn btn-sm btn-outline-primary">Send</button>
                </form>` : ''}
            </div>`).join('')}
        </div>
        <button class="btn btn-link mt-3" onclick="${AppState.user.role === 'Supervisor' ? 'renderSupervisorDashboard()' : 'renderStudentDashboard()'}">Back</button>
      </div>`;
}

async function submitReport(e, projectId) {
    e.preventDefault();
    const weekNumber = Number(document.getElementById('weekNo').value);
    const progressText = document.getElementById('progressText').value;
    const response = await apiFetch('/reports', { method: 'POST', body: { projectId, weekNumber, progressText } });
    if (!response.ok) return alert(response.message || 'Report submission failed.');
    await renderReports(projectId);
}

async function submitFeedback(e, reportId, projectId) {
    e.preventDefault();
    const feedback = document.getElementById(`fb-${reportId}`).value;
    const response = await apiFetch(`/reports/${reportId}/feedback`, { method: 'POST', body: { feedback } });
    if (!response.ok) return alert(response.message || 'Feedback submit failed.');
    await renderReports(projectId);
}

async function renderSupervisorDashboard() {
    await refreshProjects();
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="fade-in">
        <h2>Supervisor Review Center</h2>
        <p class="text-muted">Review proposals, assign tasks, monitor reports, and evaluate final submissions.</p>
        <div class="card p-3">
          <h5>Assigned Projects</h5>
          <div id="supervisorProjects"></div>
        </div>
      </div>`;
    const list = document.getElementById('supervisorProjects');
    if (AppState.projects.length === 0) {
        list.innerHTML = '<p class="text-muted">No assigned projects found.</p>';
        return;
    }
    list.innerHTML = AppState.projects.map(p => `
      <div class="d-flex justify-content-between align-items-center border-bottom py-2">
        <div><strong>${p.title}</strong> ${statusBadge(p.status)}</div>
        <div class="d-flex gap-1">
          ${(p.status === states.submitted) ? `<button class="btn btn-sm btn-success" onclick="reviewProposal(${p.id}, true)">Approve</button><button class="btn btn-sm btn-danger" onclick="reviewProposal(${p.id}, false)">Reject</button>` : ''}
          ${(p.status === states.approved || p.status === states.inProgress) ? `<button class="btn btn-sm btn-outline-success" onclick="renderTasks(${p.id})">Tasks</button><button class="btn btn-sm btn-outline-warning" onclick="renderReports(${p.id})">Reports</button>` : ''}
          ${(p.status === states.review) ? `<button class="btn btn-sm btn-primary" onclick="completeProject(${p.id})">Mark Completed</button>` : ''}
        </div>
      </div>`).join('');
}

async function reviewProposal(projectId, approve) {
    const response = await apiFetch(`/projects/${projectId}/review-proposal`, { method: 'POST', body: { approve, comment: '' } });
    if (!response.ok) return alert(response.message || 'Proposal review failed.');
    await renderSupervisorDashboard();
}

async function completeProject(projectId) {
    const response = await apiFetch(`/projects/${projectId}/complete`, { method: 'POST' });
    if (!response.ok) return alert(response.message || 'Completion failed.');
    await renderSupervisorDashboard();
}

async function renderAdminDashboard() {
    const response = await apiFetch('/projects');
    const projects = response.ok ? response.data : [];
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="fade-in">
        <h2>Admin Operations Dashboard</h2>
        <p class="text-muted">User management is available through registration flow. This panel handles project oversight and archive lifecycle.</p>
        <div class="row">
          <div class="col-md-4"><div class="card p-3"><h6>Draft</h6><h3>${projects.filter(p => p.status === states.draft).length}</h3></div></div>
          <div class="col-md-4"><div class="card p-3"><h6>In Progress</h6><h3>${projects.filter(p => p.status === states.inProgress).length}</h3></div></div>
          <div class="col-md-4"><div class="card p-3"><h6>Completed</h6><h3>${projects.filter(p => p.status === states.completed).length}</h3></div></div>
        </div>
        <div class="card p-3 mt-3">
          <h5>All Projects</h5>
          <div id="adminProjectList">
            ${projects.length === 0 ? '<p class="text-muted">No projects in system.</p>' : projects.map(p => `
              <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div><strong>${p.title}</strong> ${statusBadge(p.status)}</div>
                <div>
                  ${p.status === states.completed ? `<button class="btn btn-sm btn-dark" onclick="archiveProject(${p.id})">Archive</button>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
}

async function archiveProject(projectId) {
    const response = await apiFetch(`/projects/${projectId}/archive`, { method: 'POST' });
    if (!response.ok) return alert(response.message || 'Archive failed.');
    await renderAdminDashboard();
}

async function apiFetch(path, options = {}) {
    try {
        const response = await fetch(`${AppState.apiUrl}${path}`, {
            method: options.method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        if (!response.ok) {
            let message = 'Request failed';
            try { message = (await response.json()).message || message; } catch {}
            return { ok: false, message };
        }
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        return { ok: true, data };
    } catch (error) {
        return { ok: false, message: 'Server unreachable. Ensure backend API is running.' };
    }
}

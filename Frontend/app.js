const AppState = {
    user: null,
    apiUrl: 'http://localhost:5000/api',
    projects: [],
    selectedProjectId: null,
    users: []
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
    const query = \`?userId=\${AppState.user.id}&role=\${encodeURIComponent(AppState.user.role)}\`;
    const response = await apiFetch(\`/projects\${query}\`);
    AppState.projects = response.ok ? response.data : [];
    if (!AppState.selectedProjectId && AppState.projects.length > 0) {
        AppState.selectedProjectId = AppState.projects[0].id;
    }
}

async function fetchUsers() {
    const response = await apiFetch('/users');
    if (response.ok) AppState.users = response.data;
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
    return \`<span class="badge \${classes[status] || 'bg-secondary'}">\${status || 'N/A'}</span>\`;
}

function dateBadge(dateStr) {
    if (!dateStr) return '';
    const due = new Date(dateStr);
    const now = new Date();
    const isLate = due < now;
    return \`<span class="badge \${isLate ? 'bg-danger' : 'bg-secondary'}">\${due.toLocaleDateString()}</span>\`;
}

function studentNextAction(project) {
    if (!project) return 'Create your first project draft.';
    if (project.status === states.draft || project.status === states.rejected) return 'Submit your proposal for supervisor review.';
    if (project.status === states.submitted) return 'Waiting for supervisor decision.';
    if (project.status === states.approved || project.status === states.inProgress) return 'Work on tasks, add milestones, and submit weekly reports.';
    if (project.status === states.review) return 'Final submission is under supervisor review.';
    if (project.status === states.completed) return 'Project completed. Check your evaluation score.';
    return 'Project archived.';
}

// ==================================
// STUDENT DASHBOARD
// ==================================

async function renderStudentDashboard() {
    await refreshProjects();
    const content = document.getElementById('app-content');
    const project = getSelectedProject();
    content.innerHTML = \`
        <div class="fade-in">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>Student Workflow</h2>
                <span class="badge bg-primary">\${AppState.user.role}</span>
            </div>
            <div class="alert alert-info">
                <strong>Next action:</strong> \${studentNextAction(project)}
            </div>
            <div class="card p-3 mb-3 shadow-sm">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">My Projects</h5>
                    <button class="btn btn-sm btn-primary" onclick="renderCreateProject()">+ Create New Draft</button>
                </div>
                <div id="projectPicker" class="mt-3"></div>
            </div>
            <div id="studentActions"></div>
        </div>\`;

    renderProjectPicker();
    renderProjectDetailsPanel();
}

function renderProjectPicker() {
    const container = document.getElementById('projectPicker');
    if (AppState.projects.length === 0) {
        container.innerHTML = \`<p class="text-muted mb-0">No projects yet. Create a draft to start your workflow.</p>\`;
        return;
    }
    container.innerHTML = AppState.projects.map(p => \`
        <button class="btn \${p.id === AppState.selectedProjectId ? 'btn-primary' : 'btn-outline-secondary'} btn-sm me-2 mb-2 position-relative" onclick="selectProject(\${p.id})">
            \${p.title} \${statusBadge(p.status)}
        </button>\`).join('');
}

function selectProject(id) {
    AppState.selectedProjectId = id;
    if (AppState.user.role === 'Student') renderStudentDashboard();
    else if (AppState.user.role === 'Supervisor') renderSupervisorDashboard();
}

function renderProjectDetailsPanel() {
    const project = getSelectedProject();
    const panel = document.getElementById('studentActions');
    if (!project) return panel.innerHTML = '';

    const canSubmitProposal = project.status === states.draft || project.status === states.rejected;
    const canWork = project.status === states.approved || project.status === states.inProgress;
    const canFinalSubmit = project.status === states.inProgress;
    
    let evaluationHtml = '';
    if (project.status === states.completed || project.status === states.archived) {
        evaluationHtml = \`
            <div class="alert alert-success mt-3">
                <h5>Final Evaluation</h5>
                <p><strong>Score:</strong> \${project.evaluationScore} / 100</p>
                <p><strong>Comments:</strong> \${project.evaluationComments}</p>
            </div>\`;
    }

    panel.innerHTML = \`
        <div class="card p-4 shadow-sm border-top border-4 border-primary">
            <h4>\${project.title}</h4>
            <p class="text-muted">\${project.abstract}</p>
            <p><strong>Status:</strong> \${statusBadge(project.status)}</p>
            
            <div class="d-flex gap-2 flex-wrap mb-3 border-bottom pb-3">
                <button class="btn btn-primary" \${canSubmitProposal ? '' : 'disabled'} onclick="submitProposal(\${project.id})">1. Submit Proposal</button>
                <button class="btn btn-outline-primary" \${canWork ? '' : 'disabled'} onclick="renderTasks(\${project.id})">2. Tasks</button>
                <button class="btn btn-outline-info" \${canWork ? '' : 'disabled'} onclick="renderMilestones(\${project.id})">3. Milestones</button>
                <button class="btn btn-outline-warning" \${canWork ? '' : 'disabled'} onclick="renderReports(\${project.id})">4. Weekly Reports</button>
                <button class="btn btn-outline-secondary" \${project.status !== states.draft ? '' : 'disabled'} onclick="renderDocuments(\${project.id})">Files</button>
                <button class="btn btn-outline-dark" \${project.status !== states.draft ? '' : 'disabled'} onclick="renderLogs(\${project.id})">Activity Logs</button>
                <button class="btn btn-success ms-auto" \${canFinalSubmit ? '' : 'disabled'} onclick="finalSubmit(\${project.id})">Submit Final Project</button>
            </div>
            \${evaluationHtml}
        </div>\`;
}

async function renderCreateProject() {
    await fetchUsers();
    const students = AppState.users.filter(u => u.role === 'Student');
    
    const content = document.getElementById('app-content');
    content.innerHTML = \`
      <div class="fade-in">
        <h2>Create Project Draft</h2>
        <div class="card p-4 mt-3 shadow-sm">
          <form onsubmit="createProject(event)">
            <div class="mb-3"><label class="form-label">Project Title</label><input id="propTitle" class="form-control" required></div>
            <div class="mb-3"><label class="form-label">Abstract</label><textarea id="propAbs" class="form-control" rows="3" required></textarea></div>
            <div class="mb-3">
                <label class="form-label">Group Members (Ctrl+Click to select multiple)</label>
                <select id="propTeam" class="form-select" multiple required>
                    \${students.map(s => \`<option value="\${s.id}" \${s.id === AppState.user.id ? 'selected' : ''}>\${s.fullName} (\${s.email})</option>\`).join('')}
                </select>
                <small class="text-muted">You are automatically selected.</small>
            </div>
            <button class="btn btn-primary" type="submit">Save Draft</button>
            <button class="btn btn-link" type="button" onclick="renderStudentDashboard()">Cancel</button>
          </form>
        </div>
      </div>\`;
}

async function createProject(e) {
    e.preventDefault();
    const teamSelect = document.getElementById('propTeam');
    const selectedIds = Array.from(teamSelect.selectedOptions).map(opt => opt.value).join(',');
    
    const body = {
        title: document.getElementById('propTitle').value,
        abstract: document.getElementById('propAbs').value,
        studentIds: selectedIds
    };
    const response = await apiFetch('/projects/register', { method: 'POST', body });
    if (!response.ok) return alert(response.message || 'Unable to create project.');
    AppState.selectedProjectId = response.data.id;
    await renderStudentDashboard();
}

async function submitProposal(projectId) {
    if (!confirm('Submit proposal for supervisor review?')) return;
    const response = await apiFetch(\`/projects/\${projectId}/submit-proposal\`, { method: 'POST' });
    if (!response.ok) return alert(response.message || 'Proposal submission failed.');
    await renderStudentDashboard();
}

async function finalSubmit(projectId) {
    if (!confirm('Submit project for final evaluation? Make sure all tasks are Done.')) return;
    const response = await apiFetch(\`/projects/\${projectId}/final-submit\`, { method: 'POST' });
    if (!response.ok) return alert(response.message || 'Final submission failed.');
    await renderStudentDashboard();
}

// ==================================
// SHARED FEATURES (TASKS, MILESTONES, DOCUMENTS, LOGS)
// ==================================

async function renderTasks(projectId) {
    const tasksResponse = await apiFetch(\`/tasks/\${projectId}\`);
    const tasks = tasksResponse.ok ? tasksResponse.data : [];
    const content = document.getElementById('app-content');
    
    content.innerHTML = \`
      <div class="fade-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Task Board</h2>
            <button class="btn btn-secondary" onclick="\${AppState.user.role === 'Supervisor' ? 'renderSupervisorDashboard()' : 'renderStudentDashboard()'}">Back to Dashboard</button>
        </div>
        <div class="card p-3 mb-3 shadow-sm bg-light">
            <h5>Assign New Task</h5>
            <form class="row g-2 align-items-center" onsubmit="createTask(event, \${projectId})">
                <div class="col-md-4"><input id="taskTitle" class="form-control" placeholder="Task title" required></div>
                <div class="col-md-3"><input id="taskDesc" class="form-control" placeholder="Description"></div>
                <div class="col-md-3"><input id="taskDue" type="date" class="form-control" required></div>
                <div class="col-md-2"><button class="btn btn-success w-100">+ Add Task</button></div>
            </form>
        </div>
        <div class="card p-3 shadow-sm">
          \${tasks.length === 0 ? '<p class="text-muted mb-0">No tasks yet.</p>' : tasks.map(t => \`
            <div class="d-flex justify-content-between align-items-center border-bottom py-3">
              <div>
                <strong>\${t.title}</strong> \${dateBadge(t.dueDate)} <br>
                <small class="text-muted">\${t.description}</small>
              </div>
              <div class="d-flex align-items-center gap-2">
                \${statusBadge(t.status)}
                \${(AppState.user.role === 'Student' || AppState.user.role === 'Supervisor') ? \`
                <select class="form-select form-select-sm w-auto" onchange="updateTaskStatus(\${t.id}, this.value, \${projectId})">
                    <option value="To Do" \${t.status === 'To Do' ? 'selected' : ''}>To Do</option>
                    <option value="In Progress" \${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Done" \${t.status === 'Done' ? 'selected' : ''}>Done</option>
                </select>\` : ''}
              </div>
            </div>\`).join('')}
        </div>
      </div>\`;
}

async function createTask(e, projectId) {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const desc = document.getElementById('taskDesc').value;
    const due = document.getElementById('taskDue').value;
    
    const response = await apiFetch('/tasks', {
        method: 'POST',
        body: { projectId, title, description: desc, assignedTo: 'Team', dueDate: due }
    });
    if (!response.ok) return alert(response.message || 'Task creation failed.');
    await renderTasks(projectId);
}

async function updateTaskStatus(taskId, status, projectId) {
    const response = await apiFetch(\`/tasks/\${taskId}\`, { method: 'PUT', body: { status } });
    if (!response.ok) return alert(response.message || 'Task update failed.');
    await renderTasks(projectId);
}

async function renderMilestones(projectId) {
    const mResponse = await apiFetch(\`/milestones/\${projectId}\`);
    const milestones = mResponse.ok ? mResponse.data : [];
    const content = document.getElementById('app-content');
    
    content.innerHTML = \`
      <div class="fade-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Milestones</h2>
            <button class="btn btn-secondary" onclick="\${AppState.user.role === 'Supervisor' ? 'renderSupervisorDashboard()' : 'renderStudentDashboard()'}">Back to Dashboard</button>
        </div>
        \${(AppState.user.role === 'Student' || AppState.user.role === 'Supervisor') ? \`
        <div class="card p-3 mb-3 shadow-sm bg-light">
            <form class="d-flex gap-2" onsubmit="createMilestone(event, \${projectId})">
                <input id="mTitle" class="form-control" placeholder="Milestone Name" required>
                <input id="mDue" type="date" class="form-control" required>
                <button class="btn btn-info text-white">Create</button>
            </form>
        </div>\` : ''}
        <div class="card p-3 shadow-sm">
          \${milestones.length === 0 ? '<p class="text-muted mb-0">No milestones yet.</p>' : milestones.map(m => \`
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
              <div><strong>\${m.title}</strong> \${dateBadge(m.dueDate)}</div>
              <div>
                \${m.isCompleted ? '<span class="badge bg-success">Completed</span>' : \`
                <span class="badge bg-warning text-dark">Pending</span>
                \${(AppState.user.role === 'Student') ? \`<button class="btn btn-sm btn-outline-success ms-2" onclick="completeMilestone(\${m.id}, \${projectId})">Mark Done</button>\` : ''}
                \`}
              </div>
            </div>\`).join('')}
        </div>
      </div>\`;
}

async function createMilestone(e, projectId) {
    e.preventDefault();
    const title = document.getElementById('mTitle').value;
    const due = document.getElementById('mDue').value;
    const res = await apiFetch('/milestones', { method: 'POST', body: { projectId, title, dueDate: due, isCompleted: false }});
    if(!res.ok) return alert('Failed to create milestone');
    await renderMilestones(projectId);
}

async function completeMilestone(id, projectId) {
    const res = await apiFetch(\`/milestones/\${id}/complete\`, { method: 'PUT' });
    if(!res.ok) return alert('Failed to complete milestone');
    await renderMilestones(projectId);
}

async function renderDocuments(projectId) {
    const docsRes = await apiFetch(\`/documents/\${projectId}\`);
    const docs = docsRes.ok ? docsRes.data : [];
    const content = document.getElementById('app-content');
    
    content.innerHTML = \`
      <div class="fade-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Project Files</h2>
            <button class="btn btn-secondary" onclick="\${AppState.user.role === 'Supervisor' ? 'renderSupervisorDashboard()' : 'renderStudentDashboard()'}">Back</button>
        </div>
        <div class="card p-3 mb-3 shadow-sm bg-light">
            <form class="d-flex gap-2" onsubmit="uploadDocument(event, \${projectId})">
                <input id="docFile" type="file" class="form-control" required>
                <button class="btn btn-primary" type="submit">Upload</button>
            </form>
        </div>
        <div class="card p-3 shadow-sm">
          \${docs.length === 0 ? '<p class="text-muted mb-0">No files uploaded.</p>' : \`
            <table class="table table-striped mb-0">
                <thead><tr><th>File Name</th><th>Upload Date</th><th>Action</th></tr></thead>
                <tbody>
                \${docs.map(d => \`
                    <tr>
                        <td>\${d.fileName}</td>
                        <td>\${new Date(d.uploadedAt).toLocaleString()}</td>
                        <td><a href="http://localhost:5000\${d.filePath}" target="_blank" class="btn btn-sm btn-outline-primary">Download</a></td>
                    </tr>
                \`).join('')}
                </tbody>
            </table>
          \`}
        </div>
      </div>\`;
}

async function uploadDocument(e, projectId) {
    e.preventDefault();
    const fileInput = document.getElementById('docFile');
    if(fileInput.files.length === 0) return;
    
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('uploadedBy', AppState.user.id);
    formData.append('file', fileInput.files[0]);

    const response = await fetch(\`\${AppState.apiUrl}/documents/upload\`, {
        method: 'POST',
        body: formData
    });
    
    if(!response.ok) return alert('Upload failed.');
    await renderDocuments(projectId);
}

async function renderReports(projectId) {
    const listResponse = await apiFetch(\`/reports/\${projectId}\`);
    const reports = listResponse.ok ? listResponse.data : [];
    const content = document.getElementById('app-content');
    content.innerHTML = \`
      <div class="fade-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Weekly Reports</h2>
            <button class="btn btn-secondary" onclick="\${AppState.user.role === 'Supervisor' ? 'renderSupervisorDashboard()' : 'renderStudentDashboard()'}">Back</button>
        </div>
        <div class="card p-3 mb-3 shadow-sm bg-light">
          \${AppState.user.role === 'Student' ? \`
            <form onsubmit="submitReport(event, \${projectId})">
              <div class="mb-2"><input id="weekNo" type="number" min="1" class="form-control" placeholder="Week number" required></div>
              <div class="mb-2"><textarea id="progressText" class="form-control" rows="3" placeholder="Describe tasks completed and issues faced..." required></textarea></div>
              <button class="btn btn-warning w-100">Submit Weekly Report</button>
            </form>\` : '<p class="mb-0 text-muted">Review student reports and provide feedback below.</p>'}
        </div>
        <div class="card p-3 shadow-sm">
          \${reports.length === 0 ? '<p class="text-muted mb-0">No reports submitted yet.</p>' : reports.map(r => \`
            <div class="border-bottom py-3">
              <div class="d-flex justify-content-between">
                <strong>Week \${r.weekNumber}</strong>
                <span class="badge \${r.supervisorFeedback ? 'bg-success' : 'bg-warning text-dark'}">
                    \${r.supervisorFeedback ? 'Reviewed' : 'Pending Feedback'}
                </span>
              </div>
              <p class="mb-2 mt-2 p-2 bg-light rounded border">\${r.progressText}</p>
              
              \${r.supervisorFeedback ? \`
                  <div class="alert alert-info py-2 mb-1">
                      <strong>Feedback:</strong> \${r.supervisorFeedback}
                  </div>\` : \`
                  <p class="text-muted small">No feedback yet.</p>
              \`}
              
              \${AppState.user.role === 'Supervisor' && !r.supervisorFeedback ? \`
                <form class="d-flex gap-2 mt-2" onsubmit="submitFeedback(event, \${r.id}, \${projectId})">
                  <input id="fb-\${r.id}" class="form-control form-control-sm" placeholder="Provide feedback to student" required>
                  <button class="btn btn-sm btn-primary">Send</button>
                </form>\` : ''}
            </div>\`).join('')}
        </div>
      </div>\`;
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
    const feedback = document.getElementById(\`fb-\${reportId}\`).value;
    const response = await apiFetch(\`/reports/\${reportId}/feedback\`, { method: 'POST', body: { feedback } });
    if (!response.ok) return alert(response.message || 'Feedback submit failed.');
    await renderReports(projectId);
}

async function renderLogs(projectId) {
    const logsRes = await apiFetch(\`/logs/\${projectId}\`);
    const logs = logsRes.ok ? logsRes.data : [];
    const content = document.getElementById('app-content');
    
    content.innerHTML = \`
      <div class="fade-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Project Activity Logs</h2>
            <button class="btn btn-secondary" onclick="\${AppState.user.role === 'Admin' ? 'renderAdminDashboard()' : (AppState.user.role === 'Supervisor' ? 'renderSupervisorDashboard()' : 'renderStudentDashboard()')}">Back</button>
        </div>
        <div class="card p-3 shadow-sm">
            \${logs.length === 0 ? '<p>No activity yet.</p>' : \`
            <ul class="list-group list-group-flush">
                \${logs.map(l => \`
                    <li class="list-group-item d-flex justify-content-between">
                        <span>\${l.action}</span>
                        <small class="text-muted">\${new Date(l.timestamp).toLocaleString()}</small>
                    </li>
                \`).join('')}
            </ul>
            \`}
        </div>
      </div>\`;
}

// ==================================
// SUPERVISOR DASHBOARD
// ==================================

async function renderSupervisorDashboard() {
    await refreshProjects();
    const content = document.getElementById('app-content');
    content.innerHTML = \`
      <div class="fade-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Supervisor Review Center</h2>
            <span class="badge bg-primary">Supervisor</span>
        </div>
        <div class="card p-3 shadow-sm">
          <h5 class="border-bottom pb-2">My Assigned Projects</h5>
          <div id="supervisorProjects"></div>
        </div>
      </div>\`;
      
    const list = document.getElementById('supervisorProjects');
    if (AppState.projects.length === 0) {
        list.innerHTML = '<p class="text-muted mt-3">No assigned projects found.</p>';
        return;
    }
    
    list.innerHTML = AppState.projects.map(p => \`
      <div class="card mb-3 border-start border-4 \${p.status === states.submitted ? 'border-primary' : 'border-secondary'}">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="card-title mb-0">\${p.title}</h5>
                \${statusBadge(p.status)}
            </div>
            <p class="text-muted small mb-3">\${p.abstract}</p>
            
            <div class="d-flex gap-2 flex-wrap bg-light p-2 rounded">
                \${p.status === states.submitted ? \`
                    <button class="btn btn-sm btn-success" onclick="reviewProposal(\${p.id}, true)">Approve Proposal</button>
                    <button class="btn btn-sm btn-danger" onclick="reviewProposal(\${p.id}, false)">Reject Proposal</button>
                \` : ''}
                \${(p.status === states.approved || p.status === states.inProgress || p.status === states.review) ? \`
                    <button class="btn btn-sm btn-outline-primary" onclick="renderTasks(\${p.id})">Tasks</button>
                    <button class="btn btn-sm btn-outline-info" onclick="renderMilestones(\${p.id})">Milestones</button>
                    <button class="btn btn-sm btn-outline-warning" onclick="renderReports(\${p.id})">Reports</button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="renderDocuments(\${p.id})">Files</button>
                \` : ''}
                \${p.status === states.review ? \`
                    <button class="btn btn-sm btn-dark ms-auto" onclick="showEvaluationModal(\${p.id})">Evaluate & Complete</button>
                \` : ''}
            </div>
        </div>
      </div>\`).join('');
}

async function reviewProposal(projectId, approve) {
    if(!confirm(approve ? 'Approve this proposal?' : 'Reject this proposal?')) return;
    const response = await apiFetch(\`/projects/\${projectId}/review-proposal\`, { method: 'POST', body: { approve, comment: '' } });
    if (!response.ok) return alert(response.message || 'Proposal review failed.');
    await renderSupervisorDashboard();
}

function showEvaluationModal(projectId) {
    const score = prompt("Enter evaluation score (0-100):", "100");
    if(score === null) return;
    const comments = prompt("Enter final evaluation comments:", "Great work!");
    if(comments === null) return;
    
    completeProject(projectId, parseInt(score), comments);
}

async function completeProject(projectId, score, comments) {
    const response = await apiFetch(\`/projects/\${projectId}/complete\`, { 
        method: 'POST',
        body: { score, comments }
    });
    if (!response.ok) return alert(response.message || 'Completion failed.');
    alert('Project evaluated and completed successfully.');
    await renderSupervisorDashboard();
}

// ==================================
// ADMIN DASHBOARD
// ==================================

async function renderAdminDashboard() {
    const pResponse = await apiFetch('/projects');
    const projects = pResponse.ok ? pResponse.data : [];
    
    const sResponse = await apiFetch('/projects/analytics');
    const stats = sResponse.ok ? sResponse.data : null;

    await fetchUsers();
    const supervisors = AppState.users.filter(u => u.role === 'Supervisor');

    const content = document.getElementById('app-content');
    content.innerHTML = \`
      <div class="fade-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>Admin Operations Dashboard</h2>
            <div>
                <button class="btn btn-outline-dark" onclick="renderUserManagement()">Manage Users</button>
            </div>
        </div>
        
        \${stats ? \`
        <div class="row mb-4">
          <div class="col-md-3"><div class="card p-3 text-center bg-primary text-white shadow-sm"><h6>Total Projects</h6><h3>\${stats.totalProjects}</h3></div></div>
          <div class="col-md-3"><div class="card p-3 text-center bg-info text-white shadow-sm"><h6>Active Projects</h6><h3>\${stats.activeProjects}</h3></div></div>
          <div class="col-md-3"><div class="card p-3 text-center bg-success text-white shadow-sm"><h6>Completed</h6><h3>\${stats.completedProjects}</h3></div></div>
          <div class="col-md-3"><div class="card p-3 text-center bg-dark text-white shadow-sm"><h6>Tasks Done</h6><h3>\${stats.completedTasks} / \${stats.totalTasks}</h3></div></div>
        </div>\` : ''}
        
        <div class="card p-4 shadow-sm">
          <h5 class="border-bottom pb-2 mb-3">Global Project List</h5>
          <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Supervisor</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    \${projects.length === 0 ? '<tr><td colspan="5" class="text-center text-muted">No projects in system.</td></tr>' : 
                    projects.map(p => \`
                        <tr>
                            <td>#\${p.id}</td>
                            <td><strong>\${p.title}</strong></td>
                            <td>\${statusBadge(p.status)}</td>
                            <td>
                                <select class="form-select form-select-sm" onchange="assignSupervisor(\${p.id}, this.value)">
                                    <option value="">-- Unassigned --</option>
                                    \${supervisors.map(s => \`<option value="\${s.id}" \${p.supervisorId === s.id ? 'selected' : ''}>\${s.fullName}</option>\`).join('')}
                                </select>
                            </td>
                            <td>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-info" onclick="generateReport(\${p.id})">Report</button>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="renderLogs(\${p.id})">Logs</button>
                                    \${p.status === states.completed ? \`<button class="btn btn-sm btn-dark" onclick="archiveProject(\${p.id})">Archive</button>\` : ''}
                                </div>
                            </td>
                        </tr>
                    \`).join('')}
                </tbody>
            </table>
          </div>
        </div>
      </div>\`;
}

async function assignSupervisor(projectId, supervisorId) {
    if(!supervisorId) return;
    const response = await apiFetch(\`/projects/\${projectId}/assign-supervisor\`, { 
        method: 'POST', body: parseInt(supervisorId) 
    });
    if(!response.ok) alert('Failed to assign supervisor');
    await renderAdminDashboard();
}

async function generateReport(projectId) {
    const response = await apiFetch(\`/projects/\${projectId}/report\`);
    if(!response.ok) return alert('Failed to generate report.');
    
    const data = response.data;
    const w = window.open();
    w.document.write(\`
        <html><head><title>Report #\${projectId}</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet"></head>
        <body class="p-5">
            <h1 class="mb-4">SPMIS Project Report</h1>
            <h3>\${data.project.title} <small class="text-muted">(\${data.project.status})</small></h3>
            <p>\${data.project.abstract}</p>
            <hr>
            <h5>Evaluation</h5>
            <p>Score: \${data.project.evaluationScore || 'N/A'}</p>
            <p>Comments: \${data.project.evaluationComments || 'N/A'}</p>
            <hr>
            <h5>Statistics</h5>
            <p>Tasks: \${data.tasksCompleted} / \${data.tasksTotal} completed.</p>
            <p>Milestones: \${data.milestones.length} total.</p>
            <p>Weekly Reports: \${data.weeklyReports.length} submitted.</p>
            <hr>
            <p class="text-muted small">Generated automatically by SPMIS System on \${new Date(data.generatedAt).toLocaleString()}</p>
            <button class="btn btn-primary d-print-none" onclick="window.print()">Print Report</button>
        </body></html>
    \`);
    w.document.close();
}

async function renderUserManagement() {
    await fetchUsers();
    const content = document.getElementById('app-content');
    
    content.innerHTML = \`
      <div class="fade-in">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>User Management</h2>
            <button class="btn btn-secondary" onclick="renderAdminDashboard()">Back to Operations</button>
        </div>
        <div class="card p-4 shadow-sm">
            <table class="table table-striped">
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                <tbody>
                    \${AppState.users.map(u => \`
                        <tr>
                            <td>\${u.id}</td>
                            <td>\${u.fullName}</td>
                            <td>\${u.email}</td>
                            <td>
                                <select class="form-select form-select-sm w-auto" onchange="updateUserRole(\${u.id}, this.value)">
                                    <option value="Student" \${u.role === 'Student' ? 'selected' : ''}>Student</option>
                                    <option value="Supervisor" \${u.role === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
                                    <option value="Admin" \${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </td>
                        </tr>
                    \`).join('')}
                </tbody>
            </table>
        </div>
      </div>\`;
}

async function updateUserRole(id, role) {
    const response = await apiFetch(\`/users/\${id}/role\`, { method: 'PUT', body: role });
    if(!response.ok) alert('Failed to update role');
}

async function archiveProject(projectId) {
    if(!confirm("Are you sure you want to archive this completed project?")) return;
    const response = await apiFetch(\`/projects/\${projectId}/archive\`, { method: 'POST' });
    if (!response.ok) return alert(response.message || 'Archive failed.');
    await renderAdminDashboard();
}

async function apiFetch(path, options = {}) {
    try {
        const response = await fetch(\`\${AppState.apiUrl}\${path}\`, {
            method: options.method || 'GET',
            headers: options.body && typeof options.body !== 'string' && !(options.body instanceof FormData) ? 
                     { 'Content-Type': 'application/json' } : {},
            body: options.body instanceof FormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined)
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

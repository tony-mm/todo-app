const input = document.querySelector('#task-input');
const priorityInput = document.querySelector('#priority-input');
const dateInput = document.querySelector('#date-input');
const addBtn = document.querySelector('#add-btn');
const taskList = document.querySelector('#task-list-ul');
const profilePicInput = document.querySelector('#profile-pic-input');
const profilePicImg = document.querySelector('#profile-pic');
const statusBtns = document.querySelectorAll('.status button');
const currentDateDisplay = document.querySelector('#current-date');

// Navigation & Views
const dashboardBtn = document.getElementById('dashboard');
const calendarBtn = document.getElementById('calendar');
const projectsBtn = document.getElementById('projects');
const analyticsBtn = document.getElementById('analytics');
const profileBtn = document.getElementById('profile');
const settingsBtn = document.getElementById('settings');
const helpBtn = document.getElementById('help');

const dashboardView = document.getElementById('dashboard-view');
const calendarView = document.getElementById('calendar-view');
const projectsView = document.getElementById('projects-view');
const analyticsView = document.getElementById('analytics-view');
const helpView = document.getElementById('help-view');
const settingsView = document.getElementById('settings-view');

// Auth Extras
const forgotPasswordBtn = document.getElementById('forgot-password-link');
const googleSigninBtn = document.getElementById('google-signin-btn');
const resetOverlay = document.getElementById('reset-overlay');
const resetForm = document.getElementById('reset-form');
const backToLogin = document.getElementById('back-to-login');

let tasks = [];
let currentFilter = 'all';
const API_URL = '/todos';
const AUTH_URL = '/auth';
let currentUser = null;
let token = localStorage.getItem('token');

profilePicInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            profilePicImg.src = event.target.result;
            profilePicImg.classList.remove('profile-pic-placeholder');
            profilePicImg.classList.add('profile-pic-image');
            localStorage.setItem('profilePic', event.target.result);
        };
        reader.readAsDataURL(file);
    }
});


// Add task on Enter key
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addBtn.click();
    }
});

// Add Task Handler
addBtn.addEventListener('click', async () => {
    const title = input.value.trim();
    const priority = priorityInput.value || 'low';
    const dueDate = dateInput.value;

    if (!title) {
        alert('Please enter a task title!');
        return;
    }

    const newTask = {
        title,
        priority,
        dueDate,
        completed: false
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newTask)
        });

        if (response.status === 401) {
            alert('Your session has expired. Please log in again.');
            logout();
            return;
        }

        const data = await response.json();

        if (response.ok && data.message === 'success') {
            // Add new task to the array and re-render
            tasks.unshift(data.data);

            // If user is on a filter, maybe switch back to 'all' or confirm it fits the filter
            // For better UX, let's just make sure it renders
            renderTasks(tasks);

            // Clear inputs
            input.value = '';
            dateInput.value = '';
            priorityInput.value = 'low';
        } else {
            alert('Failed to add task: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Network error while adding task. Please check if the server is running.');
    }
});

// Load profile picture from localStorage on page load
window.addEventListener('load', () => {
    displayCurrentDate();

    const savedProfilePic = localStorage.getItem('profilePic');
    if (savedProfilePic) {
        profilePicImg.src = savedProfilePic;
        profilePicImg.classList.remove('profile-pic-placeholder');
        profilePicImg.classList.add('profile-pic-image');
    }

    fetchTasks();
});

// Status filter buttons
// Add "All" to status buttons if it's missing or handle it
statusBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        statusBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const filterName = e.target.textContent.toLowerCase();
        if (filterName === 'all') {
            currentFilter = 'all';
        } else if (filterName === 'today') {
            currentFilter = 'today';
        } else if (filterName === 'pending') {
            currentFilter = 'pending';
        } else if (filterName === 'overdue') {
            currentFilter = 'overdue';
        }

        renderTasks(tasks);
    });
});

function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTaskStatus(dueDate) {
    if (!dueDate) return 'pending'; // No due date = pending (or handle differently)

    const today = getTodayDateString();

    if (dueDate === today) {
        return 'today';
    } else if (dueDate < today) {
        return 'overdue';
    } else {
        return 'pending';
    }
}

// ----------------------------------------------------
// CORE LOGIC (Tasks, Date, etc.)
// ----------------------------------------------------

// Display current date and day of week
function displayCurrentDate() {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = days[today.getDay()];
    const monthName = months[today.getMonth()];
    const date = today.getDate();
    const year = today.getFullYear();

    currentDateDisplay.textContent = `${dayName}, ${monthName} ${date}, ${year}`;
}

// Fetch tasks from API
async function fetchTasks() {
    if (!token) return; // Don't fetch if not logged in

    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();
        if (data.message === 'success') {
            tasks = data.data;
            renderTasks(tasks);
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// ----------------------------------------------------
// VIEW SWITCHING LOGIC
// ----------------------------------------------------

function showView(viewId) {
    [dashboardView, calendarView, projectsView, analyticsView, settingsView, helpView].forEach(view => {
        if (view) view.style.display = 'none';
    });

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.style.display = 'flex';
}

dashboardBtn.addEventListener('click', () => {
    showView('dashboard-view');
    fetchTasks();
});

calendarBtn.addEventListener('click', () => {
    showView('calendar-view');
    renderCalendar();
});

projectsBtn.addEventListener('click', () => {
    showView('projects-view');
    fetchProjects();
});

analyticsBtn.addEventListener('click', () => {
    showView('analytics-view');
    showAnalytics();
});

profileBtn.addEventListener('click', (e) => {
    if (e.target === profilePicImg) {
        profilePicInput.click();
    } else {
        // Just show default profile modal for now, or go to settings
        profileModal.style.display = 'flex';
        fetchUserProfile();
    }
});

settingsBtn.addEventListener('click', () => {
    showView('settings-view');
    showSettings();
});

helpBtn.addEventListener('click', () => {
    showView('help-view');
    initHelpView();
});

// Help View Logic
function initHelpView() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.onclick = () => {
            item.classList.toggle('active');
        };
    });

    const contactForm = document.getElementById('contact-form');
    const contactMessage = document.getElementById('contact-message');
    if (contactForm) {
        contactForm.onsubmit = (e) => {
            e.preventDefault();
            contactMessage.style.display = 'block';
            contactForm.reset();
            setTimeout(() => { contactMessage.style.display = 'none'; }, 3000);
        };
    }
}

// ----------------------------------------------------
// PROJECT LOGIC
// ----------------------------------------------------

const PROJECTS_API_URL = '/projects';
const projectListContainer = document.getElementById('projects-list-container');
const projectNameInput = document.getElementById('project-name-input');
const projectDescInput = document.getElementById('project-desc-input');
const addProjectBtn = document.getElementById('add-project-btn');

const projectTasksModal = document.getElementById('project-tasks-modal');
const closeProjectModal = document.getElementById('close-project-modal');
const projectModalTitle = document.getElementById('project-modal-title');
const projectModalDesc = document.getElementById('project-modal-desc');
const projectProgressBar = document.getElementById('project-progress-bar');
const projectProgressText = document.getElementById('project-progress-text');
const projectTaskList = document.getElementById('project-task-list');
const projectTaskInput = document.getElementById('project-task-input');
const projectTaskPriority = document.getElementById('project-task-priority');
const projectTaskAddBtn = document.getElementById('project-task-add-btn');

let projects = [];
let currentActiveProject = null;

async function fetchProjects() {
    if (!token) return;
    try {
        const response = await fetch(PROJECTS_API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.message === 'success') {
            projects = data.data;
            renderProjects(projects);
        }
    } catch (error) {
        console.error('Error fetching projects:', error);
    }
}

function renderProjects(projectsList) {
    if (!projectListContainer) return;
    projectListContainer.innerHTML = '';

    if (projectsList.length === 0) {
        projectListContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 40px; grid-column: 1/-1;">No projects yet. Add one above!</p>';
        return;
    }

    projectsList.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.classList.add('project-item');
        if (project.completed) projectItem.classList.add('completed');

        const progressPercent = project.task_count > 0 ? (project.completed_count / project.task_count) * 100 : 0;

        projectItem.innerHTML = `
            <div class="project-info">
                <h3>${project.name}</h3>
                <p>${project.description || 'No description'}</p>
                <div style="margin-top: 10px; background: #eee; height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${progressPercent}%; height: 100%; background: #3454d1; transition: width 0.3s;"></div>
                </div>
            </div>
            <div class="project-stats" style="margin: 0 20px; min-width: 80px; font-weight: 500;">
                ${project.completed_count}/${project.task_count} Tasks<br>
                ${Math.round(progressPercent)}%
            </div>
            <div class="project-actions">
                <button class="delete-project-btn" title="Delete Project">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                </button>
            </div>
        `;

        projectItem.addEventListener('click', (e) => {
            if (e.target.closest('.delete-project-btn')) return;
            openProjectDetails(project);
        });

        projectItem.querySelector('.delete-project-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Delete this project and all its tasks?')) {
                await deleteProject(project.id);
            }
        });

        projectListContainer.appendChild(projectItem);
    });
}

async function openProjectDetails(project) {
    currentActiveProject = project;
    projectModalTitle.textContent = project.name;
    projectModalDesc.textContent = project.description || '';
    projectTasksModal.style.display = 'flex';
    await fetchProjectTasks(project.id);
}

closeProjectModal.addEventListener('click', () => {
    projectTasksModal.style.display = 'none';
    currentActiveProject = null;
    fetchProjects();
});

async function fetchProjectTasks(projectId) {
    try {
        const response = await fetch(`${API_URL}?project_id=${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.message === 'success') {
            renderProjectTasks(data.data);
        }
    } catch (error) {
        console.error('Error fetching project tasks:', error);
    }
}

function renderProjectTasks(pTasks) {
    projectTaskList.innerHTML = '';
    const completedCount = pTasks.filter(t => t.completed).length;
    const totalCount = pTasks.length;

    const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    projectProgressBar.style.width = `${percent}%`;
    projectProgressText.textContent = `${completedCount}/${totalCount} Tasks Completed`;

    if (pTasks.length === 0) {
        projectTaskList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No tasks in this project. Add one below!</p>';
        return;
    }

    pTasks.forEach(task => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.gap = '15px';
        li.style.padding = '12px';
        li.style.background = '#f8f9fa';
        li.style.borderRadius = '8px';
        li.style.marginBottom = '10px';
        li.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        if (task.completed) li.style.opacity = '0.6';

        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
            <span style="flex: 1; font-size: 15px; ${task.completed ? 'text-decoration: line-through;' : ''}">${task.title}</span>
            <span class="priority-tag ${task.priority}" style="font-size: 11px; padding: 2px 8px; border-radius: 4px;">${task.priority}</span>
            <button class="delete-task-btn" style="background:none; border:none; cursor:pointer;" title="Delete Task">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                 </svg>
            </button>
        `;

        li.querySelector('input').addEventListener('change', async (e) => {
            await fetch(`${API_URL}/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ completed: e.target.checked })
            });
            await fetchProjectTasks(currentActiveProject.id);
            setTimeout(fetchProjects, 100); // Update background percentage
        });

        li.querySelector('.delete-task-btn').addEventListener('click', async () => {
            if (confirm('Delete this task?')) {
                await fetch(`${API_URL}/${task.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                await fetchProjectTasks(currentActiveProject.id);
                setTimeout(fetchProjects, 100); // Update background percentage
            }
        });

        projectTaskList.appendChild(li);
    });
}

// Project Input Enter Key
projectTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        projectTaskAddBtn.click();
    }
});

projectTaskAddBtn.addEventListener('click', async () => {
    const title = projectTaskInput.value.trim();
    if (!title || !currentActiveProject) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                priority: projectTaskPriority.value,
                project_id: currentActiveProject.id,
                completed: false
            })
        });
        if (response.ok) {
            projectTaskInput.value = '';
            await fetchProjectTasks(currentActiveProject.id);
            setTimeout(fetchProjects, 100); // Small delay to ensure DB sync, then update background
        }
    } catch (error) {
        console.error('Error adding project task:', error);
    }
});

async function deleteProject(projectId) {
    try {
        const response = await fetch(`${PROJECTS_API_URL}/${projectId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) fetchProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
    }
}

addProjectBtn.addEventListener('click', async () => {
    const name = projectNameInput.value.trim();
    const description = projectDescInput.value.trim();
    if (!name) return;

    try {
        const response = await fetch(PROJECTS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description })
        });
        if (response.ok) {
            projectNameInput.value = '';
            projectDescInput.value = '';
            fetchProjects();
        }
    } catch (error) {
        console.error('Error adding project:', error);
    }
});

// Settings Data Management
document.getElementById('export-data-btn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${PROJECTS_API_URL}/export-data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.message === 'success') {
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `todo_data_export_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    } catch (err) { alert('Export failed'); }
});

document.getElementById('clear-tasks-btn').addEventListener('click', () => clearData('tasks'));
document.getElementById('clear-projects-btn').addEventListener('click', () => clearData('projects'));

async function clearData(type) {
    if (!confirm(`Are you sure you want to clear ALL ${type}? This cannot be undone.`)) return;
    try {
        await fetch(`${PROJECTS_API_URL}/clear-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type })
        });
        alert('Data cleared successfully');
        location.reload();
    } catch (err) { alert('Clear failed'); }
}


// Filter Tasks
function filterTasks(tasksArray) {
    if (!tasksArray) return [];
    if (currentFilter === 'all') return tasksArray;

    return tasksArray.filter(task => {
        const status = getTaskStatus(task.dueDate);
        return status === currentFilter;
    });
}

function renderTasks(taskArray) {
    const tasksToRender = taskArray || tasks;
    const filteredTasks = filterTasks(tasksToRender);
    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        const emptyMsg = document.createElement('li');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#999999';
        emptyMsg.style.padding = '20px';
        emptyMsg.textContent = 'No tasks in this category';
        taskList.appendChild(emptyMsg);
        return;
    }

    // Sort tasks by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };

    filteredTasks.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 1; // Default to low (1) if undefined
        const priorityB = priorityOrder[b.priority] || 1;
        return priorityB - priorityA; // Descending order
    });

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        // Add priority class
        if (task.priority) {
            li.classList.add(`priority-${task.priority}`);
        } else {
            li.classList.add('priority-low'); // Default
        }

        li.id = `task-${task.id}`;

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', async () => {
            const updatedStatus = checkbox.checked;
            try {
                const response = await fetch(`${API_URL}/${task.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ completed: updatedStatus })
                });
                const data = await response.json();
                if (data.message === 'success') {
                    task.completed = updatedStatus;
                    li.classList.toggle('completed', task.completed);
                }
            } catch (error) {
                console.error('Error updating task:', error);
                checkbox.checked = !updatedStatus; // Revert on error
            }
        });

        // Task title and date container
        const titleContainer = document.createElement('div');
        titleContainer.style.flex = '1';
        titleContainer.style.display = 'flex';
        titleContainer.style.flexDirection = 'column';
        titleContainer.style.gap = '5px';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'task-title';
        titleSpan.textContent = task.title;

        const metaContainer = document.createElement('div');
        metaContainer.style.display = 'flex';
        metaContainer.style.alignItems = 'center';
        metaContainer.style.gap = '10px';

        const dateSpan = document.createElement('span');
        dateSpan.style.fontSize = '12px';
        dateSpan.style.color = '#666666';
        dateSpan.textContent = task.dueDate ? `Due: ${task.dueDate}` : 'No due date';

        metaContainer.appendChild(dateSpan);

        if (task.project_name) {
            const projectTag = document.createElement('span');
            projectTag.className = 'project-tag';
            projectTag.textContent = task.project_name;
            metaContainer.appendChild(projectTag);
        }

        titleContainer.appendChild(titleSpan);
        titleContainer.appendChild(metaContainer);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        deleteBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_URL}/${task.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.message === 'deleted') {
                    tasks = tasks.filter(t => t.id !== task.id);
                    renderTasks(tasks);
                }
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        });

        li.appendChild(checkbox);
        li.appendChild(titleContainer);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    });
}

// ----------------------------------------------------
// AUTH & PROFILE LOGIC
// ----------------------------------------------------

const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authUsername = document.getElementById('auth-username');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchText = document.getElementById('auth-switch');
const authError = document.getElementById('auth-error');
const authSwitchBtn = document.getElementById('switch-btn');

const profileModal = document.getElementById('profile-modal');
const closeModal = document.querySelector('.close-modal');
const profileUsername = document.getElementById('profile-username');
const profileEmailDisplay = document.getElementById('profile-email');
const profileJoined = document.getElementById('profile-joined');
const logoutBtn = document.getElementById('logout-btn');

let isLoginMode = true;

// Auth Mode Toggle
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.textContent = 'Login';
        authSubmitBtn.textContent = 'Login';
        authUsername.style.display = 'none';
        authSwitchText.innerHTML = 'Don\'t have an account? <span id="switch-btn">Register</span>';
        authUsername.removeAttribute('required');
    } else {
        authTitle.textContent = 'Register';
        authSubmitBtn.textContent = 'Register';
        authUsername.style.display = 'block';
        authSwitchText.innerHTML = 'Already have an account? <span id="switch-btn">Login</span>';
        authUsername.setAttribute('required', 'true');
    }
    // Re-attach listener to new span
    document.getElementById('switch-btn').addEventListener('click', toggleAuthMode);
    authError.style.display = 'none';
}

authSwitchBtn.addEventListener('click', toggleAuthMode);

// Auth Form Submit
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const endpoint = isLoginMode ? '/login' : '/register';
    const email = authEmail.value;
    const password = authPassword.value;
    const body = { email, password };

    if (!isLoginMode) {
        body.username = authUsername.value;
    }

    try {
        const response = await fetch(`${AUTH_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            currentUser = data.user;
            authOverlay.style.display = 'none';
            fetchTasks();
            fetchUserProfile();
        } else {
            authError.textContent = data.error;
            authError.style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        authError.textContent = 'Something went wrong. Please check your connection.';
        authError.style.display = 'block';
    }
});

// ----------------------------------------------------
// AUTH EXTRAS LOGIC
// ----------------------------------------------------
if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', () => {
        authOverlay.style.display = 'none';
        resetOverlay.style.display = 'flex';
    });
}

if (backToLogin) {
    backToLogin.addEventListener('click', () => {
        resetOverlay.style.display = 'none';
        authOverlay.style.display = 'flex';
    });
}

if (googleSigninBtn) {
    googleSigninBtn.addEventListener('click', () => {
        alert('Google Sign-In is not yet configured on the server. Continuing with demo login...');
        // Mock success for demo
        token = 'demo-token';
        localStorage.setItem('token', token);
        authOverlay.style.display = 'none';
        fetchTasks();
        fetchUserProfile();
    });
}

if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.getElementById('reset-message');
        msg.textContent = 'A reset link has been sent to your email!';
        msg.style.display = 'block';
        msg.style.color = '#28a745';
        setTimeout(() => {
            resetOverlay.style.display = 'none';
            authOverlay.style.display = 'flex';
            msg.style.display = 'none';
        }, 3000);
    });
}

// Logout
function logout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    tasks = [];
    renderTasks([]);
    authOverlay.style.display = 'flex';
    profileModal.style.display = 'none';

    // Reset to login mode
    if (!isLoginMode) toggleAuthMode();
}

logoutBtn.addEventListener('click', logout);

// Profile Logic
async function fetchUserProfile() {
    if (!token) return;
    try {
        const response = await fetch(`${AUTH_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.user) {
            currentUser = data.user;
            profileUsername.textContent = currentUser.username;
            profileEmailDisplay.textContent = currentUser.email;
            profileJoined.textContent = new Date(currentUser.created_at).toLocaleDateString();
        }
    } catch (error) {
        console.error("Error fetching profile", error);
        // If token invalid, maybe logout?
        // logout();
    }
}

// Profile logic handled by combined listener above

closeModal.addEventListener('click', () => {
    profileModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target == profileModal) {
        profileModal.style.display = 'none';
    }
});

// Init on Load (auth check and theme)
if (token) {
    authOverlay.style.display = 'none';
    fetchUserProfile();
    // Apply saved theme
    applyThemeFromStorage();
} else {
    authOverlay.style.display = 'flex';
}

// ----------------------------------------------------
// SETTINGS VIEW LOGIC
// ----------------------------------------------------

// Handled by showView and populateSettings
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// Settings form elements
const settingsUsernameInput = document.getElementById('settings-username');
const settingsEmailInput = document.getElementById('settings-email');
const settingsPasswordInput = document.getElementById('settings-password');
const settingsProfilePicInput = document.getElementById('settings-profile-pic-input');
const settingsProfilePic = document.getElementById('settings-profile-pic');
const changePicBtn = document.getElementById('change-pic-btn');
const notifyPushCheckbox = document.getElementById('notify-push');
const notifyEmailCheckbox = document.getElementById('notify-email');
const themeSelect = document.getElementById('theme-select');
const defaultViewSelect = document.getElementById('default-view-select');
const languageSelect = document.getElementById('language-select');
const settingsMessageDiv = document.getElementById('settings-message');

let currentSettings = {};

async function showSettings() {
    // Fetch current settings
    try {
        const response = await fetch(`${AUTH_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.user) {
            currentSettings = data.user;
            populateSettings(data.user);
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
}

if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener('click', () => showView('dashboard-view'));
}

function populateSettings(user) {
    settingsUsernameInput.value = user.username || '';
    settingsEmailInput.value = user.email || '';
    settingsPasswordInput.value = '';

    // Profile picture
    if (user.profile_pic) {
        settingsProfilePic.src = user.profile_pic;
    }

    // Preferences
    notifyPushCheckbox.checked = user.notify_push === 1;
    notifyEmailCheckbox.checked = user.notify_email === 1;
    themeSelect.value = user.theme || 'light';
    defaultViewSelect.value = user.default_view || 'all';
    languageSelect.value = user.language || 'en';
}

// Profile picture upload
changePicBtn.addEventListener('click', () => {
    settingsProfilePicInput.click();
});

settingsProfilePicInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            settingsProfilePic.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Theme switching (live preview)
themeSelect.addEventListener('change', (e) => {
    applyTheme(e.target.value);
});

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function applyThemeFromStorage() {
    // This will be called on page load after fetching user settings
    // For now, we can check localStorage as fallback
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }
}

// Dashboard button in nav
// Handled by view switching logic

// Save settings
saveSettingsBtn.addEventListener('click', async () => {
    settingsMessageDiv.textContent = 'Saving...';
    settingsMessageDiv.className = 'message';

    const updates = {
        username: settingsUsernameInput.value,
        email: settingsEmailInput.value,
        profile_pic: settingsProfilePic.src.startsWith('data:') ? settingsProfilePic.src : null,
        notify_push: notifyPushCheckbox.checked ? 1 : 0,
        notify_email: notifyEmailCheckbox.checked ? 1 : 0,
        theme: themeSelect.value,
        default_view: defaultViewSelect.value,
        language: languageSelect.value
    };

    if (settingsPasswordInput.value) {
        updates.password = settingsPasswordInput.value;
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
            settingsMessageDiv.textContent = 'Settings saved successfully!';
            settingsMessageDiv.classList.add('success');
            settingsPasswordInput.value = '';

            // Save theme to localStorage for quick access
            localStorage.setItem('theme', updates.theme);

            // Apply theme immediately
            applyTheme(updates.theme);
        } else {
            settingsMessageDiv.textContent = data.error || 'Failed to save settings';
            settingsMessageDiv.classList.add('error');
        }
    } catch (error) {
        settingsMessageDiv.textContent = 'Connection error';
        settingsMessageDiv.classList.add('error');
    }
});

// ----------------------------------------------------
// DATA MANAGEMENT LOGIC
// ----------------------------------------------------
const exportDataBtn = document.getElementById('export-data-btn');
const clearTasksBtn = document.getElementById('clear-tasks-btn');
const clearProjectsBtn = document.getElementById('clear-projects-btn');

if (exportDataBtn) {
    exportDataBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('http://localhost:3000/projects/export-data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'todo_app_backup.json';
            a.click();
        } catch (error) {
            console.error('Export failed:', error);
        }
    });
}

if (clearTasksBtn) {
    clearTasksBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
            try {
                await fetch('http://localhost:3000/projects/clear-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ type: 'tasks' })
                });
                fetchTasks();
                alert('All tasks cleared.');
            } catch (error) {
                console.error('Clear tasks failed:', error);
            }
        }
    });
}

if (clearProjectsBtn) {
    clearProjectsBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete ALL projects and their tasks? This cannot be undone.')) {
            try {
                await fetch('http://localhost:3000/projects/clear-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ type: 'projects' })
                });
                fetchProjects();
                fetchTasks();
                alert('All projects cleared.');
            } catch (error) {
                console.error('Clear projects failed:', error);
            }
        }
    });
}

// ----------------------------------------------------
// ANALYTICS LOGIC
// ----------------------------------------------------
let completionChart = null;
let priorityChart = null;

async function showAnalytics() {
    // We need all tasks for analytics, even project ones
    try {
        const response = await fetch('http://localhost:3000/projects/export-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const allTasks = data.data.todos || [];

        const total = allTasks.length;
        const completed = allTasks.filter(t => t.completed === 1 || t.completed === true).length;
        const pending = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-completed').textContent = completed;
        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-rate').textContent = `${rate}%`;

        renderCharts(allTasks, completed, pending);
    } catch (error) {
        console.error('Error fetching analytics data:', error);
    }
}

function renderCharts(allTasks, completed, pending) {
    const ctxComp = document.getElementById('completionChart').getContext('2d');
    const ctxPrio = document.getElementById('priorityChart').getContext('2d');

    // Priority data
    const low = allTasks.filter(t => t.priority === 'low').length;
    const medium = allTasks.filter(t => t.priority === 'medium').length;
    const high = allTasks.filter(t => t.priority === 'high').length;

    if (completionChart) completionChart.destroy();
    if (priorityChart) priorityChart.destroy();

    completionChart = new Chart(ctxComp, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#28a745', '#ffc107'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    priorityChart = new Chart(ctxPrio, {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High'],
            datasets: [{
                label: 'Tasks',
                data: [low, medium, high],
                backgroundColor: ['#3454d1', '#748ffc', '#dbe4ff'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// ============================================
// CALENDAR VIEW LOGIC
// ============================================

const calendarGrid = document.querySelector('.calendar-grid');
const calendarMonthYear = document.getElementById('calendar-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const jumpTodayBtn = document.getElementById('jump-today');
const viewBtns = document.querySelectorAll('.view-btn');
const dateTasksModal = document.getElementById('date-tasks-modal');
const closeDateModal = document.getElementById('close-date-modal');
const modalDateTitle = document.getElementById('modal-date-title');
const modalTaskList = document.getElementById('modal-task-list');
const modalTaskInput = document.getElementById('modal-task-input');
const modalPriorityInput = document.getElementById('modal-priority-input');
const modalAddBtn = document.getElementById('modal-add-btn');

let currentCalendarDate = new Date();
let currentView = 'month';
let selectedDate = null;


function showCalendar() {
    showView('calendar-view');
    renderCalendar();
}

// Render Calendar Dispatcher
function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // Clear existing dates (keep headers)
    const existingDates = calendarGrid.querySelectorAll('.calendar-date');
    existingDates.forEach(date => date.remove());

    // Show/Hide day headers based on view
    const headers = calendarGrid.querySelectorAll('.calendar-day-header');
    if (currentView === 'day') {
        headers.forEach(h => h.style.display = 'none');
        calendarGrid.classList.add('day-view-active');
    } else {
        headers.forEach(h => h.style.display = 'block');
        calendarGrid.classList.remove('day-view-active');
    }

    if (currentView === 'month') {
        renderMonthView(year, month);
    } else if (currentView === 'week') {
        renderWeekView();
    } else if (currentView === 'day') {
        renderDayView();
    }
}

// Render Month View
function renderMonthView(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    const firstDayIndex = firstDay.getDay();
    const lastDateNum = lastDay.getDate();
    const prevLastDateNum = prevLastDay.getDate();

    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

    // Previous month dates
    for (let i = firstDayIndex; i > 0; i--) {
        const dateCell = createDateCell(prevLastDateNum - i + 1, year, month - 1, true);
        calendarGrid.appendChild(dateCell);
    }

    // Current month dates
    for (let i = 1; i <= lastDateNum; i++) {
        const dateCell = createDateCell(i, year, month, false);
        calendarGrid.appendChild(dateCell);
    }

    // Next month dates
    const remainingCells = 42 - (firstDayIndex + lastDateNum);
    for (let i = 1; i <= remainingCells; i++) {
        const dateCell = createDateCell(i, year, month + 1, true);
        calendarGrid.appendChild(dateCell);
    }

    addTaskIndicators();
}

// Render Week View
function renderWeekView() {
    const startOfWeek = new Date(currentCalendarDate);
    startOfWeek.setDate(currentCalendarDate.getDate() - currentCalendarDate.getDay());

    // Update header label
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    calendarMonthYear.textContent = `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateCell = createDateCell(date.getDate(), date.getFullYear(), date.getMonth(), false);
        calendarGrid.appendChild(dateCell);
    }
    addTaskIndicators();
}

// Render Day View
function renderDayView() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    calendarMonthYear.textContent = currentCalendarDate.toLocaleDateString('en-US', options);

    const dateCell = createDateCell(currentCalendarDate.getDate(), currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), false);
    dateCell.classList.add('day-mode-cell');
    calendarGrid.appendChild(dateCell);

    addTaskIndicators();
}

function createDateCell(day, year, month, isOtherMonth) {
    const dateCell = document.createElement('div');
    dateCell.classList.add('calendar-date');

    if (isOtherMonth) {
        dateCell.classList.add('other-month');
    }

    // Check if today
    const today = new Date();
    const cellDate = new Date(year, month, day);
    if (cellDate.toDateString() === today.toDateString()) {
        dateCell.classList.add('today');
    }

    dateCell.innerHTML = `
        <span class="date-number">${day}</span>
        <div class="task-indicators"></div>
    `;

    dateCell.dataset.date = cellDate.toISOString().split('T')[0];

    dateCell.addEventListener('click', () => {
        if (!isOtherMonth) {
            showDateTasks(cellDate);
        }
    });

    return dateCell;
}

function addTaskIndicators() {
    const dateCells = calendarGrid.querySelectorAll('.calendar-date:not(.other-month)');

    dateCells.forEach(cell => {
        const cellDate = cell.dataset.date;
        const tasksForDate = tasks.filter(task => task.dueDate === cellDate);

        if (tasksForDate.length > 0) {
            const indicatorsContainer = cell.querySelector('.task-indicators');
            indicatorsContainer.innerHTML = '';

            // Show up to 3 dots
            const dotsToShow = Math.min(tasksForDate.length, 3);
            for (let i = 0; i < dotsToShow; i++) {
                const dot = document.createElement('div');
                dot.classList.add('task-dot');
                if (tasksForDate[i].priority) {
                    dot.classList.add(`priority-${tasksForDate[i].priority}`);
                }
                indicatorsContainer.appendChild(dot);
            }

            // Show count if more than 3
            if (tasksForDate.length > 3) {
                const count = document.createElement('span');
                count.classList.add('task-count');
                count.textContent = tasksForDate.length;
                indicatorsContainer.appendChild(count);
            }
        }
    });
}

// Navigation
prevMonthBtn.addEventListener('click', () => {
    if (currentView === 'month') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    } else if (currentView === 'week') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() - 7);
    } else {
        currentCalendarDate.setDate(currentCalendarDate.getDate() - 1);
    }
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    if (currentView === 'month') {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    } else if (currentView === 'week') {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + 7);
    } else {
        currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }
    renderCalendar();
});

jumpTodayBtn.addEventListener('click', () => {
    currentCalendarDate = new Date();
    renderCalendar();
});

// View Switcher
viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        renderCalendar();
    });
});

// Date Tasks Modal
function showDateTasks(date) {
    selectedDate = date;
    const dateStr = date.toISOString().split('T')[0];
    const tasksForDate = tasks.filter(task => task.dueDate === dateStr);

    // Update modal title
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    modalDateTitle.textContent = `Tasks for ${date.toLocaleDateString('en-US', options)}`;

    // Render tasks
    modalTaskList.innerHTML = '';
    if (tasksForDate.length === 0) {
        modalTaskList.innerHTML = '<li style="text-align: center; color: #999;">No tasks for this date</li>';
    } else {
        tasksForDate.forEach(task => {
            const li = document.createElement('li');
            if (task.completed) {
                li.classList.add('completed');
            }
            li.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                <span>${task.title}</span>
                <span class="task-priority priority-${task.priority}">${task.priority || 'none'}</span>
            `;
            modalTaskList.appendChild(li);
        });
    }

    // Clear add task inputs
    modalTaskInput.value = '';
    modalPriorityInput.value = '';

    // Show modal
    dateTasksModal.style.display = 'flex';
}

closeDateModal.addEventListener('click', () => {
    dateTasksModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === dateTasksModal) {
        dateTasksModal.style.display = 'none';
    }
});

// Add task from modal
modalAddBtn.addEventListener('click', async () => {
    const title = modalTaskInput.value;
    const priority = modalPriorityInput.value;

    if (!title) {
        alert('Please enter a task title!');
        return;
    }

    if (!selectedDate) return;

    const dueDate = selectedDate.toISOString().split('T')[0];

    const newTask = {
        title,
        priority,
        dueDate,
        completed: false
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newTask)
        });

        if (response.ok) {
            await fetchTasks();
            showDateTasks(selectedDate);
            renderCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task');
    }
});

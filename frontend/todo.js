const input = document.querySelector('#task-input');
const priorityInput = document.querySelector('#priority-input');
const dateInput = document.querySelector('#date-input');
const addBtn = document.querySelector('#add-btn');
const taskList = document.querySelector('#task-list-ul');
const profilePicInput = document.querySelector('#profile-pic-input');
const profilePicImg = document.querySelector('#profile-pic');
const profileBtn = document.querySelector('#profile');
const statusBtns = document.querySelectorAll('.status button');
const currentDateDisplay = document.querySelector('#current-date');

let tasks = [];
let currentFilter = 'all';
const API_URL = '/todos';

// Fetch tasks from API
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.message === 'success') {
            tasks = data.data;
            renderTasks(tasks);
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

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

// Profile picture upload handler
profilePicImg.addEventListener('click', (e) => {
    e.stopPropagation();
    profilePicInput.click();
});

profileBtn.addEventListener('click', (e) => {
    if (e.target === profilePicImg) {
        profilePicInput.click();
    }
});

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


// Add Task Handler
addBtn.addEventListener('click', async () => {
    const title = input.value;
    const priority = priorityInput.value;
    const dueDate = dateInput.value;

    if (!title) {
        alert('Please enter a task!');
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTask)
        });

        const data = await response.json();

        if (data.message === 'success') {
            // Add new task to the array and re-render
            // Note: The API returns the id of the new task in data.data
            // We might want to re-fetch or reconstruct the object carefully.
            // data.data from my reading of todos.js returns { id, title, priority, dueDate, completed }

            tasks.unshift(data.data);
            renderTasks(tasks);

            // Clear inputs
            input.value = '';
            dateInput.value = '';
            priorityInput.value = 'low';
        }
    } catch (error) {
        console.error('Error adding task:', error);
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
statusBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        statusBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        if (e.target.textContent === 'Today') {
            currentFilter = 'today';
        } else if (e.target.textContent === 'Pending') {
            currentFilter = 'pending';
        } else if (e.target.textContent === 'Overdue') {
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



function filterTasks(tasksArray) {
    if (currentFilter === 'all') return tasksArray;

    return tasksArray.filter(task => {
        const status = getTaskStatus(task.dueDate);
        return status === currentFilter;
    });
}


function renderTasks(taskArray) {
    const filteredTasks = filterTasks(taskArray);
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
                    headers: { 'Content-Type': 'application/json' },
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

        const dateSpan = document.createElement('span');
        dateSpan.style.fontSize = '12px';
        dateSpan.style.color = '#666666';
        dateSpan.textContent = task.dueDate ? `Due: ${task.dueDate}` : 'No due date';

        titleContainer.appendChild(titleSpan);
        titleContainer.appendChild(dateSpan);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        deleteBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_URL}/${task.id}`, {
                    method: 'DELETE'
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
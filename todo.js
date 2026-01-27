const input = document.querySelector('#task-input');
const addBtn = document.querySelector('#add-btn');
const taskList = document.querySelector('#task-list-ul');

let tasks = [];

addBtn.addEventListener('click', () => {
    if (input.value === '') return;

    const task = {
        id: Date.now(),
        title: input.value,
        completed: false
    };

 
    tasks.push(task);
    input.value = '';
    

    renderTasks(tasks);
});

function renderTasks(taskArray) {
    taskList.innerHTML = '';

    taskArray.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.title;
        taskList.appendChild(li);
    });
}
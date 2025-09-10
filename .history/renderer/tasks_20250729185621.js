const titleInput = document.getElementById('title');
const studentsInput = document.getElementById('students');
const searchInput = document.getElementById('search');
let allTasks = []; // Store tasks here for filtering

// 1. Focus on title when app starts
window.addEventListener('DOMContentLoaded', () => {
  search.focus();
  loadTasks();
});

// Modified loadTasks to store tasks globally
async function loadTasks() {
allTasks = await window.api.getTasks();

// Sort tasks by createdAt in descending order
allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

displayTasks(allTasks); // Use helper to render rows
}

function displayTasks(tasksToRender) {
    const countElement = document.getElementById('totalTaskCount');
    const completedCountElement = document.getElementById('completedTaskCount');
    const pendingCountElement = document.getElementById('pendingTaskCount');
    countElement.textContent = `Total Tasks: ${tasksToRender.length}`;
    const completedTasks = tasksToRender.filter(task => task.status === true).length;
    const pendingTasks = tasksToRender.filter(task => task.status === false).length;
    completedCountElement.textContent = `Completed Tasks: ${completedTasks}`;
    pendingCountElement.textContent = `Pending Tasks: ${pendingTasks}`;

    const tbody = document.getElementById('allTasksTable');
    tbody.innerHTML = ''; // Clear existing rows

    tasksToRender.forEach(task => {
        const row = document.createElement('tr');

        const titleCell = document.createElement('td');
        titleCell.textContent = task.title;

        const descCell = document.createElement('td');
        descCell.textContent = task.description;

        const date = new Date(task.createdAt);
        const dateString = date.toDateString();
        const timeString = date.toTimeString().slice(0, 5);
        const dateTimeCell = document.createElement('td');
        dateTimeCell.textContent = `${dateString}      ${timeString}`;

        // Status Cell with Checkbox
        const statusCell = document.createElement('td');
        statusCell.style.textAlign = 'center';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.status === true; // Assuming `status` is a boolean
        checkbox.style.transform = 'scale(1.5)';
        checkbox.style.cursor = 'pointer';

        // Highlight row if status is true initially
        if (checkbox.checked) {
            row.classList.add('table-success');
        } else {
            row.classList.remove('table-success');
        }

        checkbox.addEventListener('change', async () => {
            const isChecked = checkbox.checked;

            // Update visual immediately
            if (isChecked) {
                row.classList.add('table-success');
            } else {
                row.classList.remove('table-success');
            }

            // Compute today's date (YYYY-MM-DD)
            const today = new Date().toISOString().split('T')[0];

            // Update status in memory
            task.status = isChecked;
            task.completedDate = isChecked ? today : null;

            //update the count dynamically
            const completedTasks = tasksToRender.filter(task => task.status === true).length;
            const pendingTasks = tasksToRender.filter(task => task.status === false).length;
            completedCountElement.textContent = `Completed Tasks: ${completedTasks}`;
            pendingCountElement.textContent = `Pending Tasks: ${pendingTasks}`;
            
            // update the DB when checkbox is toggled
            await window.api.updateTaskStatus(task.id, {
                status: isChecked,
                completedDate: isChecked ? today : null,
            });
        });
        statusCell.appendChild(checkbox);

        // Append cells to row
        row.appendChild(titleCell);
        row.appendChild(descCell);
        row.appendChild(dateTimeCell);
        row.appendChild(statusCell);

        tbody.appendChild(row);
    });
}

// Search filtering logic
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();

    if (query === '') {
        displayTasks(allTasks);
        return;
    }

    let filtered;
    if (/^\d+$/.test(query)) {
        // Input is numeric → filter by task.title
        filtered = allTasks.filter(task =>
        task.title.toLowerCase().includes(query)
        );
    } else {
        // Input is text → filter by task.description
        filtered = allTasks.filter(task =>
        task.description.toLowerCase().includes(query)
        );
    }

    displayTasks(filtered);
});

//Navigate to the Add Task window
document.getElementById('addTaskBtn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Navigate to the Add Task window wirh F2 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F1') {
    e.preventDefault();
    window.location.href = 'index.html';
  }
});

//Navigate to the Students window
document.getElementById('manageStudentsBtn').addEventListener('click', () => {
  window.location.href = 'students.html';
});

// Navigate to the Students window wirh F3 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F3') {
    e.preventDefault();
    window.location.href = 'students.html';
  }
});
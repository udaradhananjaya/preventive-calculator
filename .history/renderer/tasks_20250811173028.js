const titleInput = document.getElementById('title');
const studentsInput = document.getElementById('students');
const searchInput = document.getElementById('search');
let allTasks = []; // Store tasks here for filtering
let taskToDelete = null;

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
    const tbody = document.getElementById('allTasksTable');

    // Count totals in a single pass
    let completedTasks = 0;
    let pendingTasks = 0;
    for (const task of tasksToRender) {
        if (task.status) completedTasks++;
        else pendingTasks++;
    }

    // Update counts
    countElement.textContent = `Total Tasks: ${tasksToRender.length}`;
    completedCountElement.textContent = `Completed Tasks: ${completedTasks}`;
    pendingCountElement.textContent = `Pending Tasks: ${pendingTasks}`;

    // Clear existing rows
    tbody.innerHTML = '';

    // Render tasks
    tasksToRender.forEach(task => {
        const row = document.createElement('tr');

        // Title
        const titleCell = document.createElement('td');
        titleCell.textContent = task.title;

        // Description
        const descCell = document.createElement('td');
        descCell.textContent = task.description;

        // Date and Time
        const dateObj = new Date(task.createdAt);
        const dateString = dateObj.toDateString();
        const timeString = dateObj.toTimeString().slice(0, 5);
        const dateTimeCell = document.createElement('td');
        dateTimeCell.textContent = `${dateString}     ${timeString}`;

        // Status Cell
        const statusCell = document.createElement('td');
        statusCell.style.textAlign = 'center';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!task.status; // Ensure boolean
        checkbox.style.transform = 'scale(1.5)';
        checkbox.style.cursor = 'pointer';

        // Actions Cell (Edit & Delete)
        const actionsCell = document.createElement('td');
        actionsCell.style.textAlign = 'center';

        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn btn-sm btn-primary me-2';
        editBtn.style.minWidth = '60px';
        editBtn.addEventListener('click', () => {
            // Call your edit logic here
            // Example:
            console.log(`Editing task ID: ${task.id}`);
            // You might open a modal or form pre-filled with task data
        });

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.style.minWidth = '60px';
        deleteBtn.addEventListener('click', () => {
            taskToDelete = { task, row }; // Store both task data & its table row
            const deleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
            deleteModal.show();
        });

        // Apply initial highlight
        row.classList.toggle('table-success', checkbox.checked);

        // Handle checkbox toggle
        checkbox.addEventListener('change', async () => {
            const isChecked = checkbox.checked;

            // Visual update
            row.classList.toggle('table-success', isChecked);

            // Today's date (YYYY-MM-DD)
            const today = new Date().toISOString().split('T')[0];

            // Update in-memory data
            task.status = isChecked;
            task.completedDate = isChecked ? today : null;

            // Update counts dynamically
            if (isChecked) {
                completedTasks++;
                pendingTasks--;
            } else {
                completedTasks--;
                pendingTasks++;
            }
            completedCountElement.textContent = `Completed Tasks: ${completedTasks}`;
            pendingCountElement.textContent = `Pending Tasks: ${pendingTasks}`;

            // Persist change
            try {
                await window.api.updateTaskStatus(task.id, {
                    status: isChecked,
                    completedDate: isChecked ? today : null,
                });
            } catch (err) {
                // Revert on error
                console.error("Failed to update task status:", err);
                checkbox.checked = !isChecked;
                row.classList.toggle('table-success', checkbox.checked);
                task.status = !isChecked;
                task.completedDate = checkbox.checked ? today : null;

                // Restore counts
                if (!isChecked) {
                    completedTasks++;
                    pendingTasks--;
                } else {
                    completedTasks--;
                    pendingTasks++;
                }
                completedCountElement.textContent = `Completed Tasks: ${completedTasks}`;
                pendingCountElement.textContent = `Pending Tasks: ${pendingTasks}`;
            }
        });

        statusCell.appendChild(checkbox);
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);

        // Append cells
        row.appendChild(titleCell);
        row.appendChild(descCell);
        row.appendChild(dateTimeCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!taskToDelete) return;

    const { task, row } = taskToDelete;

    try {
        await window.api.deleteTask(task.id);
        row.remove();

        // Update counts
        if (task.status) completedTasks--;
        else pendingTasks--;
        countElement.textContent = `Total Tasks: ${--tasksToRender.length}`;
        completedCountElement.textContent = `Completed Tasks: ${completedTasks}`;
        pendingCountElement.textContent = `Pending Tasks: ${pendingTasks}`;
    } catch (err) {
        console.error("Failed to delete task:", err);
        alert("Error deleting task. Please try again.");
    } finally {
        taskToDelete = null;
        bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal')).hide();
    }
});

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
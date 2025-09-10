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

    // For modal and toast usage
    let taskToDelete = null;
    const deleteModalElement = document.getElementById('confirmDeleteModal');
    const deleteModal = new bootstrap.Modal(deleteModalElement);
    const toastElement = document.getElementById('toast');
    const toastBody = document.getElementById('toast-body');
    const toast = new bootstrap.Toast(toastElement);

    // Count totals in a single pass
    let completedTasks = 0;
    let pendingTasks = 0;
    for (const task of tasksToRender) {
        task.status ? completedTasks++ : pendingTasks++;
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
        checkbox.checked = !!task.status;
        checkbox.style.transform = 'scale(1.5)';
        checkbox.style.cursor = 'pointer';

        // Apply initial highlight
        row.classList.toggle('table-success', checkbox.checked);

        // Handle checkbox toggle
        checkbox.addEventListener('change', async () => {
            const isChecked = checkbox.checked;
            row.classList.toggle('table-success', isChecked);

            const today = new Date().toISOString().split('T')[0];
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

            try {
                await window.api.updateTaskStatus(task.id, {
                    status: isChecked,
                    completedDate: isChecked ? today : null,
                });

                // Show success toast
                toastBody.textContent = isChecked
                    ? "Task marked as completed."
                    : "Task marked as pending.";
                toastElement.className = "toast align-items-center text-white bg-success border-0";
                toast.show();

            } catch (err) {
                console.error("Failed to update task status:", err);
                checkbox.checked = !isChecked;
                row.classList.toggle('table-success', checkbox.checked);
                task.status = !isChecked;
                task.completedDate = checkbox.checked ? today : null;

                // Revert counts
                if (!isChecked) {
                    completedTasks++;
                    pendingTasks--;
                } else {
                    completedTasks--;
                    pendingTasks++;
                }
                completedCountElement.textContent = `Completed Tasks: ${completedTasks}`;
                pendingCountElement.textContent = `Pending Tasks: ${pendingTasks}`;

                // Show error toast
                toastBody.textContent = "Error updating task status.";
                toastElement.className = "toast align-items-center text-white bg-danger border-0";
                toast.show();
            }
        });
        statusCell.appendChild(checkbox);

        // Actions Cell
        const actionsCell = document.createElement('td');
        actionsCell.style.textAlign = 'center';

        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn btn-sm btn-outline-info me-2';
        editBtn.style.minWidth = '60px';
        editBtn.addEventListener('click', () => {
            console.log(`Editing task ID: ${task.id}`);
            // Open edit modal or form here
        });

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.style.minWidth = '60px';
        deleteBtn.addEventListener('click', () => {
            taskToDelete = { task, row };
            deleteModal.show();
        });

        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);

        // Append cells to row
        row.appendChild(titleCell);
        row.appendChild(descCell);
        row.appendChild(dateTimeCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });

    // Confirm Delete Modal Handler
    document.getElementById('confirmDeleteBtn').onclick = async () => {
        if (!taskToDelete) return;
        const { task, row } = taskToDelete;

        try {
            await window.api.deleteTask(task.id);
            row.remove();

            // Update counts after deletion
            if (task.status) completedTasks--;
            else pendingTasks--;
            countElement.textContent = `Total Tasks: ${--tasksToRender.length}`;
            completedCountElement.textContent = `Completed Tasks: ${completedTasks}`;
            pendingCountElement.textContent = `Pending Tasks: ${pendingTasks}`;

            // Success toast
            toastBody.textContent = "Task deleted successfully.";
            toastElement.className = "toast align-items-center text-white bg-success border-0";
            toast.show();

        } catch (err) {
            console.error("Failed to delete task:", err);
            toastBody.textContent = "Error deleting task.";
            toastElement.className = "toast align-items-center text-white bg-danger border-0";
            toast.show();
        } finally {
            taskToDelete = null;
            deleteModal.hide();
        }
    };
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
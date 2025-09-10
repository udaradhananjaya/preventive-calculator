const titleInput = document.getElementById('title');
const studentsInput = document.getElementById('students');
const searchInput = document.getElementById('search');
let allTasks = []; // Store tasks here for filtering
let taskToDelete = null;

// Show toast notifications
const toastElement = document.getElementById('toast');
const toastBody = document.getElementById('toast-body');
const toast = new bootstrap.Toast(toastElement);

function showToast(message, type = 'success') {
  // Reset classes
  toastElement.classList.remove('bg-success', 'bg-danger', 'bg-warning');
  
  // Apply color based on type
  if (type === 'success') toastElement.classList.add('bg-success');
  if (type === 'error') toastElement.classList.add('bg-danger');
  if (type === 'warning') toastElement.classList.add('bg-warning');

  toastBody.textContent = message;
  toast.show();
}

window.addEventListener('DOMContentLoaded', () => {
  // Setup Tom Select for edit modal student combo box
  async function setupEditStudentComboBox() {
    const selectEl = document.getElementById('editTaskDesc');
    if (!selectEl) return;
    const students = await window.api.getStudents();
    selectEl.innerHTML = '';
    students.forEach(s => {
      if (!s.name) return;
      const option = document.createElement('option');
      option.value = s.name;
      option.textContent = s.name;
      selectEl.appendChild(option);
    });
    if (selectEl.tomselect) selectEl.tomselect.destroy();
    new TomSelect(selectEl, {
      create: false,
      sortField: { field: 'text', direction: 'asc' },
      placeholder: 'Student',
      maxOptions: 20,
    });
  }

  setupEditStudentComboBox();

  // When edit modal is shown, set selected value to current student
  document.getElementById('editModal').addEventListener('shown.bs.modal', function () {
    const selectEl = document.getElementById('editTaskDesc');
    if (selectEl && selectEl.tomselect) {
      const currentValue = selectEl.value;
      selectEl.tomselect.setValue(currentValue, true);
    }
  });

  search.focus();
  loadTasks();

  const searchInput = document.getElementById('search');
  const markAllBtn = document.getElementById('markAllCompletedBtn');
  const printPendingBtn = document.getElementById('printPendingBtn');

  // Hide the button initially
  markAllBtn.style.display = 'none';
  printPendingBtn.style.display = 'none';

  // Listen for changes in the search input
  searchInput.addEventListener('input', () => {
      if (searchInput.value.trim() !== '') {
          markAllBtn.style.display = 'block'; // Show
          printPendingBtn.style.display = 'block'; // Show
      } else {
          markAllBtn.style.display = 'none';  // Hide
          printPendingBtn.style.display = 'none';  // Hide
      }
  });

  // Listen for Escape key to clear search input
  document.addEventListener('keydown', (e) => {
    const searchDate = document.getElementById('searchDate');
    if (e.key === 'Escape' && (searchInput.value || searchDate.value)) {
      searchInput.value = '';
      searchDate.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchDate.dispatchEvent(new Event('input'));
      searchInput.focus();
    }
  });

});

// Modified loadTasks to store tasks globally
async function loadTasks() {
  allTasks = await window.api.getTasks();

  // Sort tasks by createdAt in descending order
  allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  displayTasks(allTasks); // Use helper to render rows
}

//Edit Task Form Submission
const editTaskForm = document.getElementById('editTaskForm');
const editModal = new bootstrap.Modal(document.getElementById('editModal'));

// This will be triggered when the user submits the edit form
editTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editTaskId').value;
  const title = document.getElementById('editTaskTitle').value;
  const description = document.getElementById('editTaskDesc').value;
  const newDateOnly = document.getElementById('editTaskDate').value;
  const completedCheckbox = document.getElementById('editCompletedCheckbox');
  const comment = document.getElementById('editTaskComment').value;

  // Validation: only 1-6 digits
  if (!/^\d{1,6}$/.test(title)) {
    showToast('Title must be 1 to 6 digits only.', 'error');
    return;
  }

  // Preserve time part from original createdAt
  const original = new Date(editTaskForm.dataset.originalCreatedAt);  
  const [year, month, day] = newDateOnly.split('-').map(Number);

  const mergedDate = new Date(
    year, 
    month - 1, 
    day,
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
    original.getMilliseconds()
  );

  // Set status and completedDate from checkbox
  let status = completedCheckbox.checked ? 1 : 0;
  let completedDate = status === 1 ? new Date().toISOString() : null;

  // Explicitly clear completedDate if status is 0
  if (status === 0) completedDate = null;

  const updatedTask = {
    id,
    title,
    description,
    createdAt: mergedDate.toISOString(),
    status,
    completedDate,
    comment: comment
  };

  console.log('Sending update:', updatedTask);
  const result = await window.api.updateTask(updatedTask);

  if (result.success) {
    showToast('Task updated successfully!', 'success');
    editModal.hide();
    // Reload from DB
    if (searchInput.value.trim() !== '') {
      await loadTasks();
      filterTasks();
    } else {
      await loadTasks();
    }
  } else {
    showToast(`Error updating task: ${result.error}`, 'error');
  }
});

function updateTaskCounts(tasksToRender) {
  const countElement = document.getElementById('totalTaskCount');
  const completedCountElement = document.getElementById('completedTaskCount');
  const pendingCountElement = document.getElementById('pendingTaskCount');
  const detainedCountElement = document.getElementById('detainedTaskCount');

  let completedTasks = 0;
  let detainedTasks = 0;
  for (const task of tasksToRender) {
    if (task.status) completedTasks++;
    if (task.detained) detainedTasks++;
  }
  const pendingTasks = tasksToRender.length - completedTasks - detainedTasks;

  countElement.textContent = `Total Tasks: ${tasksToRender.length}`;
  completedCountElement.textContent = `Completed Tasks: ${completedTasks}`;
  pendingCountElement.textContent = `Pending Tasks: ${pendingTasks}`;
  detainedCountElement.textContent = `Detained Tasks: ${detainedTasks}`;
}

function displayTasks(tasksToRender) {
  updateTaskCounts(tasksToRender);
  const tbody = document.getElementById('allTasksTable');

  // Clear existing rows
  tbody.innerHTML = '';

  // Render tasks
  tasksToRender.forEach(task => {
      const row = document.createElement('tr');

      // Title
      const titleCell = document.createElement('td');
      titleCell.textContent = task.title;

      // If task.comment has a value, make text red and add tooltip
      if (task.comment && task.comment.trim() !== '') {
        titleCell.style.color = 'red';
        titleCell.setAttribute('data-bs-toggle', 'tooltip');
        titleCell.setAttribute('data-bs-placement', 'top');
        titleCell.setAttribute('data-bs-html', 'true'); // Enable HTML
        titleCell.setAttribute('title', task.comment.replace(/\n/g, '<br>')); // Convert newlines to <br>
        titleCell.style.cursor = 'help';
        // Initialize Bootstrap tooltip
        setTimeout(() => {
          new bootstrap.Tooltip(titleCell);
        }, 0);
      }

      // Description
      const descCell = document.createElement('td');
      descCell.textContent = task.description;
      descCell.style.cursor = 'pointer';
      descCell.addEventListener('click', () => {
      searchInput.value = task.description;
      searchInput.dispatchEvent(new Event('input'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Date and Time
      const dateObj = new Date(task.createdAt);
      // Format for cell: '19th Aug 2025'
      const day = dateObj.getDate();
      const monthShort = dateObj.toLocaleString('en-US', { month: 'short' });
      const monthLong = dateObj.toLocaleString('en-US', { month: 'long' });
      const year = dateObj.getFullYear();
      // Get day of week
      const weekday = dateObj.toLocaleString('en-US', { weekday: 'long' });
      // Get time in HH:mm
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      // Ordinal suffix as superscript
      function ordinalSup(n) {
        const s = ["th", "st", "nd", "rd"], v = n % 100;
        const suffix = (s[(v - 20) % 10] || s[v] || s[0]);
        return { num: n, sup: suffix };
      }
      const ord = ordinalSup(day);
      const cellTextHtml = `<span>${ord.num}<sup>${ord.sup}</sup> ${monthShort} ${year}</span>`;
      const tooltipText = `${weekday}, ${ord.num}${ord.sup} ${monthLong} ${year} at ${hours}:${minutes}`;
      const dateTimeCell = document.createElement('td');
      dateTimeCell.innerHTML = cellTextHtml;
      dateTimeCell.setAttribute('data-bs-toggle', 'tooltip');
      dateTimeCell.setAttribute('data-bs-placement', 'top');
      dateTimeCell.setAttribute('title', tooltipText);
      dateTimeCell.style.cursor = 'help';
      // Initialize Bootstrap tooltip
      setTimeout(() => {
        new bootstrap.Tooltip(dateTimeCell);
      }, 0);

      // Status Cell
      const statusCell = document.createElement('td');
      statusCell.style.textAlign = 'center';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.status;
      checkbox.style.transform = 'scale(1.5)';
      checkbox.style.cursor = 'pointer';
        // Make completed or detained tasks' checkboxes uncheckable
        if (checkbox.checked || task.detained) {
          checkbox.disabled = true;
        }

      // Apply initial highlight
      row.classList.toggle('table-success', checkbox.checked);
      row.classList.toggle('table-warning', task.detained);

      // Handle checkbox toggle
      checkbox.addEventListener('change', async () => {
      const isChecked = checkbox.checked;
      row.classList.toggle('table-success', isChecked);

      const today = new Date().toISOString().split('T')[0];
      task.status = isChecked;
      task.completedDate = isChecked ? today : null;
      // Disable checkbox so it can't be unchecked
      checkbox.disabled = true;
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
        // Reload tasks and update counts
        if (searchInput.value.trim() !== '') {
          await loadTasks();
          filterTasks();
        } else {
          await loadTasks();
        }
      } catch (err) {
        console.error("Failed to update task status:", err);
        checkbox.checked = !isChecked;
        row.classList.toggle('table-success', checkbox.checked);
        task.status = !isChecked;
        task.completedDate = checkbox.checked ? today : null;
        // Show error toast
        toastBody.textContent = "Error updating task status.";
        toastElement.className = "toast align-items-center text-white bg-danger border-0";
        toast.show();
        // Re-enable checkbox if update failed
        checkbox.disabled = false;
      }
      });
      statusCell.appendChild(checkbox);

      // Completed At Cell
      const completedAtCell = document.createElement('td');
      if (task.completedDate) {
        // Format as '19th Aug 2025' or similar
        const completedDateObj = new Date(task.completedDate);
        const day = completedDateObj.getDate();
        const monthShort = completedDateObj.toLocaleString('en-US', { month: 'short' });
        const year = completedDateObj.getFullYear();
        // Ordinal suffix as superscript
        function ordinalSup(n) {
          const s = ["th", "st", "nd", "rd"], v = n % 100;
          const suffix = (s[(v - 20) % 10] || s[v] || s[0]);
          return { num: n, sup: suffix };
        }
        const ord = ordinalSup(day);
        completedAtCell.innerHTML = `<span>${ord.num}<sup>${ord.sup}</sup> ${monthShort} ${year}</span>`;
        completedAtCell.title = completedDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        completedAtCell.textContent = '-';
      }

      // Actions Cell

      const actionsCell = document.createElement('td');
      actionsCell.style.textAlign = 'center';

      // Edit Button
      const createdAt = new Date(task.createdAt);
      const isoDate = createdAt.toISOString().split('T')[0];
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'btn btn-sm btn-outline-info me-2';
      editBtn.style.minWidth = '60px';
      editBtn.addEventListener('click', () => {
          console.log(`Editing task ID: ${task.id}`);
          document.getElementById('editTaskId').value = task.id;
          document.getElementById('editTaskTitle').value = task.title;
          document.getElementById('editTaskDesc').value = task.description || '';
          document.getElementById('editTaskDate').value = isoDate || '';
          document.getElementById('editTaskComment').value = task.comment || '';
          editTaskForm.dataset.originalCreatedAt = task.createdAt;
          const completedCheckbox = document.getElementById('editCompletedCheckbox');
          const completedLabel = document.querySelector('label[for="editCompletedCheckbox"]');
          if (task.status) {
            completedCheckbox.checked = true;
            completedLabel.textContent = 'Completed';
            completedLabel.style.color = '#4caf50';
            completedLabel.style.textShadow = '0 0 6px #4caf50, 0 0 2px #222';
          } else {
            completedCheckbox.checked = false;
            completedLabel.textContent = 'Not Completed';
            completedLabel.style.color = '#f44336';
            completedLabel.style.textShadow = '0 0 6px #f44336, 0 0 2px #222';
          }
          completedCheckbox.addEventListener('change', function() {
            if (this.checked) {
              completedLabel.textContent = 'Completed';
              completedLabel.style.color = '#4caf50';
              completedLabel.style.textShadow = '0 0 6px #4caf50, 0 0 2px #222';
            } else {
              completedLabel.textContent = 'Not Completed';
              completedLabel.style.color = '#f44336';
              completedLabel.style.textShadow = '0 0 6px #f44336, 0 0 2px #222';
            }
          });
          editModal.show();
      });

      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'btn btn-sm btn-outline-danger me-2';
      deleteBtn.style.minWidth = '60px';
      deleteBtn.addEventListener('click', () => {
          taskToDelete = { task, row };
          deleteModal.show();
      });

      // Detained Button
      const detainedBtn = document.createElement('button');
      detainedBtn.textContent = 'Detained';
      detainedBtn.className = task.detained ? 'btn btn-sm btn-outline-dark' : 'btn btn-sm btn-outline-warning';
      detainedBtn.style.minWidth = '60px';
      detainedBtn.addEventListener('click', async () => {
        // Toggle detained property in backend
        // Prevent marking as detained if already completed
        if (task.status) {
          showToast('Cannot mark a completed task as detained.', 'error');
          return;
        }
        try {
          const newDetained = !task.detained;
          await window.api.updateTaskDetained(task.id, { detained: newDetained });
          task.detained = newDetained;
          detainedBtn.className = newDetained ? 'btn btn-sm btn-outline-dark' : 'btn btn-sm btn-outline-warning';
          row.classList.toggle('table-warning', newDetained);
          checkbox.disabled = newDetained ? true : false;
          showToast(newDetained ? 'Marked as detained.' : 'Detained removed.', newDetained ? 'warning' : 'success');
          // Update counts after detained status changes
          updateTaskCounts(allTasks);
        } catch (err) {
          showToast('Error updating detained status.', 'error');
        }
      });

      actionsCell.appendChild(editBtn);
      actionsCell.appendChild(deleteBtn);
      actionsCell.appendChild(detainedBtn);

      // Append cells to row
      row.appendChild(titleCell);
      row.appendChild(descCell);
      row.appendChild(dateTimeCell);
      row.appendChild(statusCell);
      row.appendChild(completedAtCell);
      row.appendChild(actionsCell);

      tbody.appendChild(row);
  });
}

// Confirm Delete Modal Handler
const deleteModalElement = document.getElementById('confirmDeleteModal');
const deleteModal = new bootstrap.Modal(deleteModalElement);
document.getElementById('confirmDeleteBtn').onclick = async () => {
    if (!taskToDelete) return;
    const { task, row } = taskToDelete;

    try {
        await window.api.deleteTask(task.id);
        row.remove();
        showToast("Task deleted successfully.", 'success');

    } catch (err) {
        console.error("Failed to delete task:", err);
        showToast("Error deleting task.", 'error');
    } finally {
        taskToDelete = null;
        deleteModal.hide();
        // Reload from DB or just refresh filtered list
        if (searchInput.value.trim() === '') {
            loadTasks(); // this calls displayTasks(freshTasks)
        } else {
            await loadTasks(); // get fresh tasks from DB
            filterTasks();     // then filter and display
        }
    }
};


// Search filtering logic

function filterTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const dateValue = document.getElementById('searchDate').value;

  let filtered = allTasks;

  // Filter by search input
  if (query !== '') {
    if (/^\d+$/.test(query)) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query)
      );
    } else {
      filtered = filtered.filter(task =>
        task.description.toLowerCase().includes(query)
      );
    }
  }

  // Filter by date picker
  if (dateValue) {
    filtered = filtered.filter(task => {
      // Format task.createdAt to YYYY-MM-DD
      const taskDate = new Date(task.createdAt);
      const formatted = taskDate.toISOString().split('T')[0];
      return formatted === dateValue;
    });
  }

  displayTasks(filtered);
}

searchInput.addEventListener('input', filterTasks);
document.getElementById('searchDate').addEventListener('input', filterTasks);

// Show modal when user clicks Mark All button
document.getElementById('markAllCompletedBtn').addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('confirmMarkAllModal'));
    modal.show();
});

document.getElementById('confirmMarkAllBtn').addEventListener('click', () => {
    // Find all checkboxes inside the displayed table rows
    const checkboxes = document.querySelectorAll('table input[type="checkbox"]');

    checkboxes.forEach(cb => {
        if (!cb.checked) { // Only mark if it's not already checked
            cb.checked = true;
            cb.dispatchEvent(new Event('change'));
        }
    });
    // Close modal after marking
    bootstrap.Modal.getInstance(document.getElementById('confirmMarkAllModal')).hide();
});


// Listen for Enter key while either confirmation modal is open
document.addEventListener('keydown', function (e) {
  const deleteModalEl = document.getElementById('confirmDeleteModal');
  const markAllModalEl = document.getElementById('confirmMarkAllModal');

  const isDeleteModalOpen = deleteModalEl.classList.contains('show');
  const isMarkAllModalOpen = markAllModalEl.classList.contains('show');

  if ((isDeleteModalOpen || isMarkAllModalOpen) && e.key === 'Enter') {
    e.preventDefault(); // prevent accidental submits/line breaks

    if (isDeleteModalOpen) {
      document.getElementById('confirmDeleteBtn').click();
    } else if (isMarkAllModalOpen) {
      document.getElementById('confirmMarkAllBtn').click();
    }
  }
});

// Focus on the title input when the edit modal is shown
// This ensures the user can start typing immediately
document.getElementById('editModal').addEventListener('shown.bs.modal', function () {
  const input = document.getElementById('editTaskTitle');
  input.focus();
  input.select();
});

// Toggle fullscreen with F11
window.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    window.api.toggleFullscreen(); // Use your preload API or ipcRenderer
  }
});

//Navigate to the Add Task window
document.getElementById('addTaskBtn').addEventListener('click', () => {
  window.api.navigateToIndex();
});

// Navigate to the Add Task window with F2 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F1') {
    e.preventDefault();
    window.api.navigateToIndex();
  }
});

//Navigate to the Students window
document.getElementById('manageStudentsBtn').addEventListener('click', () => {
  window.api.navigateToStudents();
});

// Navigate to the Students window with F3 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F3') {
    e.preventDefault();
    window.api.navigateToStudents();
  }
});

//Navigate to the Summary window
document.getElementById('summaryBtn').addEventListener('click', () => {
  window.api.navigateToSummary();
});

// Navigate to the Summary window with F4 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F4') {
    e.preventDefault();
    window.api.navigateToSummary();
  }
});

//navigate to the Credits window with F9 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F9') {
    e.preventDefault();
    window.api.navigateCredits();
  }
});

let sortAscending = true;

document.getElementById('titleHeader').addEventListener('click', () => {
  sortAscending = !sortAscending;
  // Get the currently filtered list
  const query = searchInput.value.trim().toLowerCase();
  const dateValue = document.getElementById('searchDate').value;

  let filtered = allTasks;

  // Filter by search input
  if (query !== '') {
    if (/^\d+$/.test(query)) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query)
      );
    } else {
      filtered = filtered.filter(task =>
        task.description.toLowerCase().includes(query)
      );
    }
  }

  // Filter by date picker
  if (dateValue) {
    filtered = filtered.filter(task => {
      const taskDate = new Date(task.createdAt);
      const formatted = taskDate.toISOString().split('T')[0];
      return formatted === dateValue;
    });
  }

  // Sort the filtered list
  const sorted = [...filtered].sort((a, b) => {
    if (a.title < b.title) return sortAscending ? -1 : 1;
    if (a.title > b.title) return sortAscending ? 1 : -1;
    return 0;
  });

  displayTasks(sorted);
});

document.getElementById('printPendingBtn').addEventListener('click', () => {
  // Get the currently filtered tasks
  const query = searchInput.value.trim().toLowerCase();
  const dateValue = document.getElementById('searchDate').value;

  let filtered = allTasks;

  // Filter by search input
  if (query !== '') {
    if (/^\d+$/.test(query)) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query)
      );
    } else {
      filtered = filtered.filter(task =>
        task.description.toLowerCase().includes(query)
      );
    }
  }

  // Filter by date picker
  if (dateValue) {
    filtered = filtered.filter(task => {
      const taskDate = new Date(task.createdAt);
      const formatted = taskDate.toISOString().split('T')[0];
      return formatted === dateValue;
    });
  }

  // Only pending tasks (not completed)
  const pendingTasks = filtered.filter(task => !task.status);

  // Generate a simple report (customize as needed)
  let reportWindow = window.open('', '', 'width=900,height=700');
  let html = `
    <html>
    <head>
      <title>Pending Tasks Report</title>
      <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #333; padding: 8px; }
        th { background: #222; color: #fff; }
      </style>
    </head>
    <body>
      <h2>Pending Tasks Report</h2>
      <table>
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
  `;
  pendingTasks.forEach(task => {
    html += `
      <tr>
        <td>${task.title}</td>
        <td>${new Date(task.createdAt).toLocaleDateString()}</td>
      </tr>
    `;
  });
  html += `
        </tbody>
      </table>
      <script>window.print();</script>
    </body>
    </html>
  `;
  reportWindow.document.write(html);
  reportWindow.document.close();
});

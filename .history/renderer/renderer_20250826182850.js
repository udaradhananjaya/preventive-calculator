const form = document.getElementById('task-form');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const commentInput = document.getElementById('comment');
let ts;
let studentIdToName = {};

window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById("createdAt").valueAsDate = new Date();
  titleInput.focus();
  // Fetch names and initialize enforced combo-box
  async function setupStudentComboBox() {
    const selectEl = document.getElementById('description');
    const students = await window.api.getStudents(); // full student objects

    studentIdToName = {};
    selectEl.innerHTML = '';
    students.forEach(s => {
      if (!s.name) return;
      studentIdToName[s.id] = s.name;

      const option = document.createElement('option');
      option.value = s.id.toString(); // value is studentId
      option.textContent = s.name;    // label shown
      selectEl.appendChild(option);
    });

    ts = new TomSelect(selectEl, {
      create: false,
      openOnFocus: false,
      sortField: { field: 'text', direction: 'asc' },
      placeholder: 'Student',
      maxOptions: 50,
      onType: function () {
        // Clear existing selection when user starts typing
        if (this.getValue() !== '') {
          this.clear(true); // true = silent (no change event if you prefer)
        }
      }
    });

    ts.clear();

    ts.control_input.addEventListener("keydown", function(e) {
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        descriptionInput.tomselect.getValue() !== ''
      ) {
        e.preventDefault();
        commentInput.focus();
      }
    });
  }

  await setupStudentComboBox();

  // Listen for clipboard value and set title field
  window.api.onSetTitleField((value) => {
    titleInput.value = value;
    document.getElementById('description').tomselect?.focus();
  });

});

// Handle Enter key in title and comment
titleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && titleInput.value.trim() !== '') {
    e.preventDefault(); // prevent form submission
    document.getElementById('description').tomselect?.focus();
  }
});

commentInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); // prevent form submission
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  }
});

const descSelect = document.getElementById('description');
descSelect.addEventListener('change', () => {
  descSelect.classList.remove('is-invalid');
});

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await handleFormSubmit();
});

async function handleFormSubmit() {
  const title = titleInput.value.trim();
  const selectedStudentId = ts.getValue(); // string
  const studentName = studentIdToName[selectedStudentId]; // safe lookup
  const status = false;
  const datePicker = document.getElementById("createdAt").value;
  const comment = commentInput.value();

  if (!title) {
    showToast('Title is required.', 'danger');
    titleInput.focus();
    return;
  }

  if (!selectedStudentId) {
    showToast('Please choose a student from the list.', 'danger');
    return;
  }

  const createdAt = new Date();
  const createdYear = createdAt.getFullYear();
  // Keep current time, replace date
  createdAt.setFullYear(
    parseInt(datePicker.slice(0, 4)), // year
    parseInt(datePicker.slice(5, 7)) - 1, // month (0-based)
    parseInt(datePicker.slice(8, 10)) // day
  );

  // Send data to backend
  const result = await window.api.addTask({
    title,
    description: studentName,
    status,
    studentId: parseInt(selectedStudentId, 10),
    createdAt: createdAt.toISOString(),
    createdYear, // pass the year here for unique constraint
    comment
  });

  if (result.success) {
    form.reset();
    titleInput.focus();
    loadTasks();
    showToast('Task added successfully!', 'success');
    document.getElementById("createdAt").valueAsDate = new Date();
  } else {
    // Display the exact DB error or a fallback message
    showToast(`${result.error || 'Failed to add task.'}`, 'danger');
  }
}


//Load today's tasks into the table
async function loadTasks() {
  const tasks = await window.api.getTasks();

  // Get today's date boundaries
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

  // Filter tasks created today
  const todaysTasks = tasks.filter(task => {
    const createdAt = new Date(task.createdAt);
    return createdAt >= today && createdAt < tomorrow;
  });

  // Sort tasks by createdAt in descending order
  todaysTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Display count at top
  const countElement = document.getElementById('todayTaskCount');
  if (countElement) {
    countElement.textContent = `Today's Tasks: ${todaysTasks.length}`;
  }

  const tbody = document.getElementById('taskTableBody');
  tbody.innerHTML = ''; // Clear existing rows

  todaysTasks.forEach(task => {
    const row = document.createElement('tr');

    const titleCell = document.createElement('td');
    titleCell.textContent = task.title;

    const descCell = document.createElement('td');
    descCell.textContent = task.description;

    const date = new Date(task.createdAt);
    const dateString = date.toDateString(); // e.g. "Sun Jul 27 2025"
    const timeString = date.toTimeString().slice(0, 5); // e.g. "13:35"
    const dateTimeCell = document.createElement('td');
    dateTimeCell.textContent = `${dateString}       ${timeString}`;

    row.appendChild(titleCell);
    row.appendChild(descCell);
    row.appendChild(dateTimeCell);

    tbody.appendChild(row);
  });
}

// Clear inputs on Esc key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    form.reset();
    if (typeof ts?.clear === 'function') ts.clear(); // Reset TomSelect combo box
    titleInput.focus();
    document.getElementById("createdAt").valueAsDate = new Date();
  }
});

//Navigate to the All Tasks window
document.getElementById('viewTasksBtn').addEventListener('click', () => {
  window.api.navigateToTasks();
});

// Navigate to the All Tasks window with F1 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F2') {
    e.preventDefault();
    window.api.navigateToTasks();
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

//Show toast function
function showToast(message, type = 'success') {
  const toastEl = document.getElementById('toast');
  const toastBody = document.getElementById('toast-body');

  // Set message and background color
  toastBody.textContent = message;
  toastEl.className = `toast align-items-center text-white bg-${type} border-0`;

  // Show the toast
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

// Toggle fullscreen with F11
window.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    window.api.toggleFullscreen(); // Use your preload API or ipcRenderer
  }
});

loadTasks();
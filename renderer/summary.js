let summaryData = [];       // store fetched summary data globally
let sortDirection = {       // track sort direction for each column
  name: 'asc',
  totalPending: 'asc'
};

async function loadSummaryTable() {
  const summaryTable = document.getElementById('summaryTable');

  try {
    summaryTable.innerHTML = ''; // Clear existing rows

    summaryData = await window.api.getStudentTaskSummary(); // store globally

    renderSummaryTable(summaryData);
  } catch (error) {
    console.error('Error loading summary table:', error);
    summaryTable.innerHTML = `
      <tr>
        <td colspan="3" style="color: red;">Failed to load summary</td>
      </tr>
    `;
  }
}

function renderSummaryTable(data) {
  const summaryTable = document.getElementById('summaryTable');
  summaryTable.innerHTML = '';

  data.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.totalPending}</td>
      <td>${student.tasksList}</td>
    `;
    summaryTable.appendChild(row);
  });
}

// Sorting helpers
function sortByName() {
  const dir = sortDirection.name;
  summaryData.sort((a, b) => dir === 'asc' 
    ? a.name.localeCompare(b.name) 
    : b.name.localeCompare(a.name)
  );
  sortDirection.name = dir === 'asc' ? 'desc' : 'asc';
  renderSummaryTable(summaryData);
}

function sortByPending() {
  const dir = sortDirection.totalPending;
  summaryData.sort((a, b) => dir === 'asc' 
    ? a.totalPending - b.totalPending 
    : b.totalPending - a.totalPending
  );
  sortDirection.totalPending = dir === 'asc' ? 'desc' : 'asc';
  renderSummaryTable(summaryData);
}

// Add click listeners to headers
document.getElementById('thName').addEventListener('click', sortByName);
document.getElementById('thPending').addEventListener('click', sortByPending);

// Load the table initially
window.addEventListener('DOMContentLoaded', loadSummaryTable);

// Toggle fullscreen with F11
window.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    window.api.toggleFullscreen(); // Use your preload API or ipcRenderer
  }
});

//Navigate to the Add Task window
document.getElementById('addTaskBtn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Navigate to the Add Task window with F2 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F1') {
    e.preventDefault();
    window.location.href = 'index.html';
  }
});

//Navigate to the All Tasks window
document.getElementById('viewTasksBtn').addEventListener('click', () => {
  window.location.href = 'tasks.html';
});

// Navigate to the All Tasks window with F1 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F2') {
    e.preventDefault();
    window.location.href = 'tasks.html';
  }
});

//Navigate to the Students window
document.getElementById('manageStudentsBtn').addEventListener('click', () => {
  window.location.href = 'students.html';
});

// Navigate to the Students window with F3 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F3') {
    e.preventDefault();
    window.location.href = 'students.html';
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
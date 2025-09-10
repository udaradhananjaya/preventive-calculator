window.addEventListener('DOMContentLoaded', async () => {
  const summaryTable = document.getElementById('summaryTable');

  try {
    summaryTable.innerHTML = ''; // Clear existing rows

    const summaryData = await window.summaryAPI.getStudentTaskSummary();

    summaryData.forEach(student => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${student.name}</td>
        <td>${student.totalPending}</td>
        <td>${student.tasksList}</td>
      `;
      summaryTable.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading summary table:', error);
    const errorRow = document.createElement('tr');
    errorRow.innerHTML = `
      <td colspan="3" style="color: red;">Failed to load summary</td>
    `;
    summaryTable.appendChild(errorRow);
  }
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

//Navigate to the All Tasks window
document.getElementById('viewTasksBtn').addEventListener('click', () => {
  window.location.href = 'tasks.html';
});

// Navigate to the All Tasks window wirh F1 key
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

// Navigate to the Students window wirh F3 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F3') {
    e.preventDefault();
    window.location.href = 'students.html';
  }
});
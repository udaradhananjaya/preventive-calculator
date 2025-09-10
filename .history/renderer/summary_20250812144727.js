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
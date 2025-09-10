let currentSort = { key: 'name', direction: 'asc' };

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('student-form');
  const tableBody = document.querySelector('#student-table tbody');

  function loadStudents() {
    const searchInput = document.getElementById('student-search');
    const query = searchInput?.value?.trim() || '';
    
    window.api.getStudents().then(students => {
      
      if (currentSort.key) {
        students.sort((a, b) => {
          let valA = a[currentSort.key]?.toLowerCase?.() || '';
          let valB = b[currentSort.key]?.toLowerCase?.() || '';
          if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
          if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }

      let filtered = students;

      if (query) {
        const fuse = new Fuse(students, {
          keys: ['name', 'phone', 'companies'],
          threshold: 0.4,
        });

        const results = fuse.search(query);
        filtered = results.map(r => r.item);
      }

      tableBody.innerHTML = '';
      filtered.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${student.name}</td>
          <td>${student.phone}</td>
          <td>${student.companies}</td>
          <td>${student.description}</td>
          <td>    
            <button class="btn btn-sm btn-outline-info me-2" onclick="editStudent(${student.id})">
              Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})">
              Delete
            </button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    });
  }

  //listens to search bar input changes
  document.getElementById('student-search').addEventListener('input', () => {
    loadStudents();
  });

  window.editStudent = (id) => {
    const formSection = document.getElementById('add-student-section');

    // Show the form if hidden, then load data
    if (formSection.style.display === 'none') {
      formSection.style.display = 'block';
      document.getElementById('toggleAddStudentBtn').textContent = 'Hide Form';

      // Delay loading student data slightly to ensure the form is rendered
      setTimeout(() => {
        loadStudentData(id);
      }, 10); // small delay to ensure DOM updates
    } else {
      loadStudentData(id);
    }
  };

  // Separate function to load data into the form
  function loadStudentData(id) {
    window.api.getStudent(id).then(student => {
      document.getElementById('student-id').value = student.id;
      document.getElementById('name').value = student.name;
      document.getElementById('phone').value = student.phone;
      document.getElementById('companies').value = student.companies;
      document.getElementById('description').value = student.description;
      document.getElementById('name').focus();
    });
  }


  let studentIdToDelete = null; // keep track of which student to delete

  // Triggered by Delete button in table
  window.deleteStudent = (id) => {
    studentIdToDelete = id;
    const deleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    deleteModal.show();
  };

  // When user clicks "Delete" in modal
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (!studentIdToDelete) return;

    window.api.deleteStudent(studentIdToDelete).then(() => {
      document.getElementById('student-form').reset();
      document.getElementById('student-id').value = '';
      studentIdToDelete = null;
      showToast('Student deleted successfully!', 'danger');
      loadStudents();

      // Force focus to recover input bug
      setTimeout(() => {
        document.getElementById('name').focus();
      }, 50);

      // Close the modal programmatically
      const deleteModalEl = document.getElementById('confirmDeleteModal');
      const modalInstance = bootstrap.Modal.getInstance(deleteModalEl);
      modalInstance.hide();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('student-id').value;
    const data = {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      companies: document.getElementById('companies').value,
      description: document.getElementById('description').value,
    };
      const done = () => {
        form.reset();
        document.getElementById('student-id').value = '';
        loadStudents();
        document.getElementById('name').focus(); // return focus to first field
      };

    if (id) {
      window.api.updateStudent(parseInt(id), data).then(() => {
        showToast('Student updated successfully!', 'info');
        done();
      });
    } else {
      window.api.addStudent(data).then(() => {
        showToast('Student added successfully!');
        done();
      });
    }
  });

  document.querySelectorAll('th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      const icon = th.querySelector('i');

      // Toggle sort direction
      if (currentSort.key === key) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.key = key;
        currentSort.direction = 'asc';
      }

      // Reset all icons
      document.querySelectorAll('th.sortable i').forEach((i) => {
        i.className = 'bi bi-arrow-down-up';
      });

      // Update current icon
      icon.className =
        currentSort.direction === 'asc' ? 'bi bi-arrow-up' : 'bi bi-arrow-down';

      loadStudents();
    });
  });

  loadStudents();
  document.getElementById('student-search').focus();

  const toggleBtn = document.getElementById('toggleAddStudentBtn');
  const addSection = document.getElementById('add-student-section');

  toggleBtn.addEventListener('click', () => {
    const isHidden = addSection.style.display === 'none';

    addSection.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = isHidden ? 'Hide Form' : 'Add Student';

    if (isHidden) {
      document.getElementById('name').focus(); // Focus first field
    } else {
      document.getElementById('student-search').focus(); // focus search field when form is hidden
    }
  });

});


const form = document.getElementById('student-form');
const inputs = [
  document.getElementById('name'),
  document.getElementById('phone'),
  document.getElementById('companies'),
  document.getElementById('description'),
];

inputs.forEach((input, index) => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = inputs[index + 1];

      if (nextInput) {
        nextInput.focus();
      } else {
        // Last input → Submit form
        form.requestSubmit(); // triggers submit event
      }
    }
  });
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

//reset button functionality
document.getElementById('resetFormBtn').addEventListener('click', () => {
  const form = document.getElementById('student-form');
  form.reset();
  document.getElementById('student-id').value = ''; // clear hidden ID
  document.getElementById('name').focus(); // optional: return focus to first input
  showToast('Form cleared.', 'info');
});

//Listens for enter key while delete confirmation shows
document.addEventListener('keydown', function (e) {
  const modalEl = document.getElementById('confirmDeleteModal');
  const isModalOpen = modalEl.classList.contains('show');

  if (isModalOpen && e.key === 'Enter') {
    e.preventDefault(); // prevent form submit or accidental line breaks

    // Trigger the confirm delete button
    document.getElementById('confirmDeleteBtn').click();
  }
});

//Navigate to the All Tasks window
document.getElementById('viewTasksBtn').addEventListener('click', () => {
  window.location.href = 'tasks.html';
});

// Navigate to the All Tasks window wirh F2 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F2') {
    e.preventDefault();
    window.location.href = 'tasks.html';
  }
});

//Navigate to the Add Task window
document.getElementById('addTaskBtn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Navigate to the Add Task window wirh F1 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F1') {
    e.preventDefault();
    window.location.href = 'index.html';
  }
});

// Navigate to the Summary window wirh F4 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F4') {
    e.preventDefault();
    window.location.href = 'summary.html';
  }
});
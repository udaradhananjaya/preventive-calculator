let incomes = [];
let expenses = [];

// Fetch students for income titles
async function loadStudentNames() {
  const select = document.getElementById('incomeTitle');
  select.innerHTML = '';
  const students = await window.api.getStudentNames();
  students.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
  if (select.tomselect) select.tomselect.destroy();
  new TomSelect(select, {
    create: false,
    openOnFocus: false,
    sortField: { field: 'text', direction: 'asc' },
    placeholder: 'Select student',
    maxOptions: 50,
  });
  select.tomselect.clear();
}

function renderTables() {
  // Income table
  const incomeTable = document.getElementById('incomeTable');
  incomeTable.innerHTML = '';
  incomes.forEach(i => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${i.title}</td><td>${i.amount}</td>`;
    incomeTable.appendChild(row);
  });
  // Expense table
  const expenseTable = document.getElementById('expenseTable');
  expenseTable.innerHTML = '';
  expenses.forEach(e => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${e.title}</td><td>${e.amount}</td>`;
    expenseTable.appendChild(row);
  });
  // Balance
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  document.getElementById('balanceDisplay').textContent = `Balance: ${totalIncome - totalExpense}`;
}

// Add income
const incomeForm = document.getElementById('incomeForm');
incomeForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('incomeTitle').value;
  const amount = document.getElementById('incomeAmount').value;
  if (!title || !amount) return;
  incomes.push({ title, amount: Number(amount) });
  incomeForm.reset();
  renderTables();
});

// Add expense
const expenseForm = document.getElementById('expenseForm');
expenseForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('expenseTitle').value;
  const amount = document.getElementById('expenseAmount').value;
  if (!title || !amount) return;
  expenses.push({ title, amount: Number(amount) });
  expenseForm.reset();
  renderTables();
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadStudentNames();
  renderTables();

  // Set default date to today
  const dateInput = document.getElementById('datePicker');
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  //focus incomeTitle input
  const incomeTitleInput = document.getElementById('incomeTitle');
  incomeTitleInput.tomselect?.focus();
});

// Toggle fullscreen with F11
window.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    window.api.toggleFullscreen(); // Use your preload API or ipcRenderer
  }
});

// Go to index page with F1 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F1') {
    e.preventDefault();
    window.api.navigateToIndex();
  }
});

// Go to tasks page with F2 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F2') {
    e.preventDefault();
    window.api.navigateToTasks();
  }
});

// Go to students page with F3 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F3') {
    e.preventDefault();
    window.api.navigateToStudents();
  }
});

// Go to summary page with F4 key
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === 'F4') {
    e.preventDefault();
    window.api.navigateToSummary();
  }
});
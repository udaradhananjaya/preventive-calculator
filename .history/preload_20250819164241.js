const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  unlock: () => ipcRenderer.send('unlock-success'),
  addTask: (data) => ipcRenderer.invoke('add-task', data),
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  updateTaskStatus: (id, updateData) =>
    ipcRenderer.invoke('update-task-status', { id, updateData }),
  getStudents: () => ipcRenderer.invoke('get-students'),
  getStudent: (id) => ipcRenderer.invoke('get-student', id),
  addStudent: (data) => ipcRenderer.invoke('add-student', data),
  updateStudent: (id, data) => ipcRenderer.invoke('update-student', id, data),
  deleteStudent: (id) => ipcRenderer.invoke('delete-student', id),
  getStudentNames: () => ipcRenderer.invoke('get-student-names'),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
  getStudentTaskSummary: () => ipcRenderer.invoke('get-student-task-summary'),
  updateTask: (task) => ipcRenderer.invoke('update-task', task),
  closeWindow: () => ipcRenderer.send("close-window"),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  updateTaskDetained: (id, data) => ipcRenderer.invoke('update-task-detained', { id, ...data }),

  //Navigations
  navigateCredits: () => ipcRenderer.send('navigate-credits'),
  navigateToTasks: () => ipcRenderer.send('navigate-tasks'),
  navigateToStudents: () => ipcRenderer.send('navigate-students'),
  navigateToSummary: () => ipcRenderer.send('navigate-summary'),
  navigateToIndex: () => ipcRenderer.send('navigate-index'),

  // Listen for clipboard value and set title field
  onSetTitleField: (callback) => ipcRenderer.on('set-title-field', (event, value) => callback(value)),
});
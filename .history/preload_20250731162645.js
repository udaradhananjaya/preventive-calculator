const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addTask: (data) => ipcRenderer.invoke('add-task', data),
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  updateTaskStatus: (id, updateData) =>
    ipcRenderer.invoke('update-task-status', { id, updateData }),
  loadIndex: () => ipcRenderer.send('load-index'),
  getStudents: () => ipcRenderer.invoke('get-students'),
  getStudent: (id) => ipcRenderer.invoke('get-student', id),
  addStudent: (data) => ipcRenderer.invoke('add-student', data),
  updateStudent: (id, data) => ipcRenderer.invoke('update-student', id, data),
  deleteStudent: (id) => ipcRenderer.invoke('delete-student', id),
  getStudentNames: () => ipcRenderer.invoke('get-student-names'),
});
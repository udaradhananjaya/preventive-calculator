const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { sequelize, Task, Student, Company } = require('./models');
let win;

async function createWindow() {
  await sequelize.sync({alter: true}) // or { force: true } for dropping and recreating
  .then(() => {
    console.log("Database synced");
  })
  .catch((err) => {
    console.error("Sync failed:", err);
  });

  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile('./renderer/index.html');
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.on('load-index', () => {
    if (win) {
      win.loadFile('./renderer/index.html');
    }
  });
});

// IPC Handlers

// ipcMain.on('load-index', () => {
//   if (win) {
//     win.loadFile('./renderer/index.html');
//   }
// });

ipcMain.handle('add-task', async (event, data) => {
  const task = await Task.create(data);
  return task.get({ plain: true }); // convert Sequelize instance to plain object
});

ipcMain.handle('get-tasks', async () => {
  const tasks = await Task.findAll();
  return tasks.map(task => task.get({ plain: true }));
});

ipcMain.handle('update-task-status', async (event, { id, updateData }) => {
  await Task.update(updateData, { where: { id } });
});

// Delete task handler
ipcMain.handle('delete-task', async (event, taskId) => {
    try {
        await Task.destroy({ where: { id: taskId } });
        return { success: true };
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error; // Will be caught in renderer
    }
});

// Student IPC Handlers
ipcMain.handle('get-students', async () => {
  const students = await Student.findAll();
  return students.map(s => s.toJSON()); // Return raw data
});

ipcMain.handle('get-student', async (_, id) => {
  const student = await Student.findByPk(id);
  return student?.toJSON(); // ✅ convert to plain object
});

//get student names for autofill
ipcMain.handle('get-student-names', async () => {
  const students = await Student.findAll({ attributes: ['name'] });
  return students.map(s => s.name);
});

ipcMain.handle('add-student', async (_, data) => {
  return await Student.create(data);
});

ipcMain.handle('update-student', async (_, id, data) => {
  const student = await Student.findByPk(id);
  if (student) return await student.update(data);
});

ipcMain.handle('delete-student', async (_, id) => {
  const student = await Student.findByPk(id);
  if (student) return await student.destroy();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
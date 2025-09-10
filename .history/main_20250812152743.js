const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { sequelize, Task, Student, Company } = require('./models');
let win;

async function createWindow() {
  await sequelize.sync() // or { force: true } for dropping and recreating
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
  try {
    const task = await Task.create(data);
    return {
      success: true,
      data: task.get({ plain: true })
    };
  } catch (error) {
    console.error('Database error while adding task:', error);

    let message = error.message || 'An unexpected database error occurred';

    // If it's a unique constraint error, build a friendly message
    if (error.name === 'SequelizeUniqueConstraintError' && error.errors?.length) {
      const duplicateValue = error.errors[0]?.value; // e.g., "111111"
      message = `${duplicateValue} already exists. The Task ID must be unique.`;
    }

    return {
      success: false,
      error: message
    };
  }
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


ipcMain.handle('get-student-task-summary', async () => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: Task,
          where: { status: false }, // Only pending tasks
          required: false           // Still include if no tasks
        }
      ],
      order: [['name', 'ASC']] // Sort alphabetically
    });

    return students.map(student => {
      const pendingTasks = student.Tasks || [];
      return {
        name: student.name,
        totalPending: pendingTasks.length,
        tasksList: pendingTasks.map(t => t.title).join(', ')
      };
    });

  } catch (error) {
    console.error('Error fetching student task summary:', error);
    return [];
  }
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
const { app, BrowserWindow, ipcMain, Menu, clipboard } = require('electron');
const path = require('path');
const { sequelize, Task, Student, Company } = require('./models');
let mainWindow;

let lastClipboardValue = '';

function startClipboardWatcher() {
  setInterval(() => {
    const value = clipboard.readText().trim();
    // Only numbers, max 6 digits
    if (/^\d{1,6}$/.test(value) && value !== lastClipboardValue) {
      lastClipboardValue = value;
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.loadFile('./renderer/index.html').then(() => {
          mainWindow.webContents.send('set-title-field', value);
        });
      }
    }
  }, 1000); // Check every second
}

async function createLockScreen() {
  const lockWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    center: true,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  Menu.setApplicationMenu(null);
  lockWindow.loadFile('./renderer/lockscreen.html');

  // Unlock event handler
  ipcMain.on('unlock-success', () => {
    createMainWindow();   // open main window
    lockWindow.close();   // close lockscreen
  });
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile('./renderer/index.html');
  startClipboardWatcher();
}

// Sync database first
app.whenReady().then(async () => {
  try {
    await sequelize.sync();// or { force: true } for dropping and recreating
    console.log("Database synced");
  } catch (err) {
    console.error("Sync failed:", err);
  }

  // Start with lock screen
  createLockScreen();
});

//close calculator with close button
ipcMain.on("close-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

//minimize calculator with minimize button
ipcMain.on('minimize-window', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

//--------------------------------Navigation Handlers--------------------------------
ipcMain.on('navigate-tasks', () => {
  if (mainWindow) {
    mainWindow.loadFile('./renderer/tasks.html');
  }
});

ipcMain.on('navigate-students', () => {
  if (mainWindow) {
    mainWindow.loadFile('./renderer/students.html');
  }
});

ipcMain.on('navigate-summary', () => {
  if (mainWindow) {
    mainWindow.loadFile('./renderer/summary.html');
  }
});

ipcMain.on('navigate-index', () => {
  if (mainWindow) {
    mainWindow.loadFile('./renderer/index.html');
  }
});

ipcMain.on('navigate-credits', () => {
  if (mainWindow) {
    mainWindow.loadFile('./renderer/credits.html');
  }
});

//--------------------------------Database Handlers--------------------------------


// Add task handler
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

// Get tasks handler
ipcMain.handle('get-tasks', async () => {
  const tasks = await Task.findAll();
  return tasks.map(task => task.get({ plain: true }));
});

// Update task status handler
ipcMain.handle('update-task-status', async (event, { id, updateData }) => {
  await Task.update(updateData, { where: { id } });
});

// Update task handler
ipcMain.handle('update-task', async (event, updatedTask) => {
  try {
    const task = await Task.findByPk(updatedTask.id);
    if (!task) throw new Error('Task not found');

    await task.update({
      title: updatedTask.title,
      description: updatedTask.description,
      createdAt: updatedTask.createdAt || task.createdAt,
      completedDate: updatedTask.completedDate ?? task.completedDate,
      status: updatedTask.status ?? task.status
    });

    return { success: true, task };
  } catch (err) {
    console.error('Update error:', err);
    return { success: false, error: err.message };
  }
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


// Add student handler
ipcMain.handle('add-student', async (_, data) => {
  return await Student.create(data);
});

// Get all students handler
ipcMain.handle('get-students', async () => {
  const students = await Student.findAll();
  return students.map(s => s.toJSON()); // Return raw data
});

// Get student by ID handler
ipcMain.handle('get-student', async (_, id) => {
  const student = await Student.findByPk(id);
  return student?.toJSON(); // ✅ convert to plain object
});

// Get student names for dropdown handler
ipcMain.handle('get-student-names', async () => {
  const students = await Student.findAll({ attributes: ['name'] });
  return students.map(s => s.name);
});

// Update student handler
ipcMain.handle('update-student', async (_, id, data) => {
  const student = await Student.findByPk(id);
  if (student) return await student.update(data);
});

// Delete student handler
ipcMain.handle('delete-student', async (_, id) => {
  const student = await Student.findByPk(id);
  if (student) return await student.destroy();
});

// Student task summary handler
ipcMain.handle('get-student-task-summary', async () => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: Task,
          where: { status: false }, // Only pending tasks
          required: true           // Still include if no tasks
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

// Update task detained status handler
ipcMain.handle('update-task-detained', async (event, { id, detained }) => {
  try {
    await Task.update({ detained }, { where: { id } });
    return { success: true };
  } catch (error) {
    console.error('Error updating detained status:', error);
    return { success: false, error: error.message };
  }
});


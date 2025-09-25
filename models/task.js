// task.js 
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
    },
    completedDate: {
      type: DataTypes.DATEONLY,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Students', key: 'id' },
    },
    detained: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['title', 'createdYear']
      }
    ]
  });

  const fs = require('fs');
  function logChange(message) {
    fs.appendFileSync('changes.log', `[${new Date().toISOString()}] ${message}\n`);
  }

  // Log CREATE
  Task.addHook('afterCreate', (task, options) => {
    logChange(`[Task] id=${task.id} created: ${JSON.stringify(task.toJSON())}`);
  });

  // Log UPDATE
  Task.addHook('afterUpdate', (task, options) => {
    const changed = task.changed();
    if (changed && changed.length > 0) {
      changed.forEach(field => {
        logChange(`[Task] id=${task.id} field=${field} updated: "${task.previous(field)}" → "${task.get(field)}"`);
      });
    }
  });

  // Log DELETE
  Task.addHook('afterDestroy', (task, options) => {
    logChange(`[Task] id=${task.id} deleted: ${JSON.stringify(task.toJSON())}`);
  });

  return Task;
};

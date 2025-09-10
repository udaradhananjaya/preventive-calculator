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

  // Add a hook to log changes
  Task.addHook('afterUpdate', (task, options) => {
    const changed = task.changed(); // array of changed fields
    if (changed && changed.length > 0) {
      const logLines = changed.map(field => {
        return `[Task] id=${task.id} field=${field} changed: "${task.previous(field)}" → "${task.get(field)}"`;
      });
      // Append to your log file
      const fs = require('fs');
      fs.appendFileSync('changes.log', logLines.join('\n') + '\n');
    }
  });

  return Task;
};

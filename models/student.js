// student.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define('Student', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    phone: {
      type: DataTypes.STRING,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  const fs = require('fs');
  function logChange(message) {
    fs.appendFileSync('changes.log', `[${new Date().toISOString()}] ${message}\n`);
  }

  // Log CREATE
  Student.addHook('afterCreate', (student, options) => {
    logChange(`[Student] id=${student.id} created: ${JSON.stringify(student.toJSON())}`);
  });

  // Log UPDATE
  Student.addHook('afterUpdate', (student, options) => {
    const changed = student.changed();
    if (changed && changed.length > 0) {
      changed.forEach(field => {
        logChange(`[Student] id=${student.id} field=${field} updated: "${student.previous(field)}" → "${student.get(field)}"`);
      });
    }
  });

  // Log DELETE
  Student.addHook('afterDestroy', (student, options) => {
    logChange(`[Student] id=${student.id} deleted: ${JSON.stringify(student.toJSON())}`);
  });

  return Student;
};
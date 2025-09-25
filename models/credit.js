// credit.js
const { DataTypes } = require('sequelize');
const fs = require('fs');

module.exports = (sequelize) => {
  const Credit = sequelize.define('Credit', {
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Students', key: 'id' },
    },
  });

  function logChange(message) {
    fs.appendFileSync('changes.log', `[${new Date().toISOString()}] ${message}\n`);
  }

  // Log CREATE
  Credit.addHook('afterCreate', (credit, options) => {
    logChange(`[Credit] id=${credit.id} created: ${JSON.stringify(credit.toJSON())}`);
  });

  // Log UPDATE
  Credit.addHook('afterUpdate', (credit, options) => {
    const changed = credit.changed();
    if (changed && changed.length > 0) {
      changed.forEach(field => {
        logChange(`[Credit] id=${credit.id} field=${field} updated: "${credit.previous(field)}" → "${credit.get(field)}"`);
      });
    }
  });

  // Log DELETE
  Credit.addHook('afterDestroy', (credit, options) => {
    logChange(`[Credit] id=${credit.id} deleted: ${JSON.stringify(credit.toJSON())}`);
  });

  return Credit;
};
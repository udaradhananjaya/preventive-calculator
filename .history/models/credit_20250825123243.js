const { DataTypes } = require('sequelize');
const sequelize = require('./index').sequelize;

const Credit = sequelize.define('Credit', {
  income: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  expenses: {
    type: DataTypes.FLOAT,
    allowNull: false,
  }
});

module.exports = Credit;
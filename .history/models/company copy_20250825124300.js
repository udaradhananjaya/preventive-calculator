const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Credit', {
    income: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    expenses: {
      type: DataTypes.FLOAT,
      allowNull: false,
    }
  });
};
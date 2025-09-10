const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Company', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};
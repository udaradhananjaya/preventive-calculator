const { DataTypes } = require('sequelize');
const sequelize = require('./index').sequelize;
const Student = require('./student');

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

// Associations
Credit.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(Credit, { foreignKey: 'studentId'
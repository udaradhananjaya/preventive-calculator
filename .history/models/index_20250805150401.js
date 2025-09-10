const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'tasks.sqlite',
  logging: false, // optional
});

// Import models
const Task = require('./task')(sequelize);
const Student = require('./student')(sequelize);
const Company = require('./company')(sequelize);

// Define associations

// Student ↔ Task (1:M)
Student.hasMany(Task, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Task.belongsTo(Student, { foreignKey: 'studentId' });

// Student ↔ Company (1:M)
Student.hasMany(Company, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Company.belongsTo(Student, { foreignKey: 'studentId' });

module.exports = {
  sequelize,
  Task,
  Student,
  Company,
};

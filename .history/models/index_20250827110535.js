const { Sequelize } = require('sequelize');
const fs = require('fs');
const logStream = fs.createWriteStream('sequelize.log', { flags: 'a' }); // 'a' for append

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'tasks.sqlite',
  logging: (msg) => logStream.write(msg + '\n'), // Log to file
});

// Import models
const Task = require('./task')(sequelize);
const Student = require('./student')(sequelize);
const Company = require('./company')(sequelize);
const Credit = require('./credit')(sequelize);

// Define associations

// Student ↔ Task (1:M)
Student.hasMany(Task, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Task.belongsTo(Student, { foreignKey: 'studentId' });

// Student ↔ Company (1:M)
Student.hasMany(Company, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Company.belongsTo(Student, { foreignKey: 'studentId' });

// Student ↔ Credit (1:M)
Student.hasMany(Credit, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Credit.belongsTo(Student, { foreignKey: 'studentId' });

  
module.exports = {
  sequelize,
  Task,
  Student,
  Company,
  Credit
};

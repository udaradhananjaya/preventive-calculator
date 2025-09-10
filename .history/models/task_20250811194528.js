module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Task', {
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
  }, {
    indexes: [
      {
        unique: true,
        fields: ['title', 'createdYear']
      }
    ]
  });
};

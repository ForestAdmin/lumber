const Sequelize = require('sequelize');

const singleModel = [{
  name: 'user',
  attributes: {
    email: {
      type: Sequelize.STRING,
      unique: true,
      validate: { isEmail: true },
    },
    emailValid: { type: Sequelize.BOOLEAN },
    firstName: { type: Sequelize.STRING },
    lastName: {
      type: Sequelize.STRING,
      validate: {
        len: [0, 50],
      },
    },
    username: { type: Sequelize.STRING },
    password: { type: Sequelize.STRING },
    createdAt: { type: Sequelize.DATE },
    updatedAt: { type: Sequelize.DATE },
    resetPasswordToken: { type: Sequelize.STRING },
  },
}];

module.exports = singleModel;

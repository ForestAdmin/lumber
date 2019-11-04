const Sequelize = require('sequelize');

class SingleModel {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }
  build() {
    const User = this.sequelize.define('user', {
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
    });
    return [User];
  }
}

module.exports = SingleModel;

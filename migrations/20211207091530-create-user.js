'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      image: { 
        type: Sequelize.STRING,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING,
      primaryKey: true
      },
      pw: {
        allowNull: false,
        type: Sequelize.STRING
      },
      phone: {
        allowNull: false,
        type: Sequelize.STRING
      },
      birth: {
        allowNull: false,
        type: Sequelize.DATE
      },
      postcode: {
        allowNull: false,
        type: Sequelize.STRING
      },
      modifyAddress: {
        allowNull: false,
        type: Sequelize.STRING
      },
      detailAddress: {
        allowNull: false,
        type: Sequelize.STRING
      },
      intro: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      salt: {
        type: Sequelize.STRING
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
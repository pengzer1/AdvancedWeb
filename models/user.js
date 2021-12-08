'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  var user = sequelize.define('user', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      isEMAIL: true,
      primaryKey: true
    },
    pw: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    birth: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postcode: {
      type: DataTypes.STRING,
      allowNull: false,
    },    
    modifyAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    detailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
   salt:{
     type: DataTypes.STRING
   }
  });
  return user;
};
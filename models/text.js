'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  var text = sequelize.define('text', {
    listName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    input: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });
  return text;
};
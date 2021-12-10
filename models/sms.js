'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sms extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  sms.init({
    fromWho: DataTypes.STRING,
    toWho: DataTypes.STRING,
    cont: DataTypes.STRING,
    stat: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'sms',
  });
  return sms;
};
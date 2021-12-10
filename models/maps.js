'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class maps extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  maps.init({
    name: DataTypes.STRING,
    positions: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'maps',
  });
  return maps;
};
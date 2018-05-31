'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('sqlite_stat1', {
  }, {
    tableName: 'sqlite_stat1',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


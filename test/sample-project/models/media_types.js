'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('media_types', {
    'MediaTypeId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'Name': {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'media_types',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


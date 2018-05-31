'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('genres', {
    'GenreId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'Name': {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'genres',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


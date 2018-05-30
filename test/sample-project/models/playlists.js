'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('playlists', {
    'PlaylistId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'Name': {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'playlists',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


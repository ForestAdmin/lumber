'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('albums', {
    'AlbumId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'Title': {
      type: DataTypes.STRING,
    },
    'ArtistId': {
      type: DataTypes.INTEGER,
    },
  }, {
    tableName: 'albums',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


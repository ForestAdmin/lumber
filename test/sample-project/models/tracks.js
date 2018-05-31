'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('tracks', {
    'TrackId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'Name': {
      type: DataTypes.STRING,
    },
    'AlbumId': {
      type: DataTypes.INTEGER,
    },
    'MediaTypeId': {
      type: DataTypes.INTEGER,
    },
    'GenreId': {
      type: DataTypes.INTEGER,
    },
    'Composer': {
      type: DataTypes.STRING,
    },
    'Milliseconds': {
      type: DataTypes.INTEGER,
    },
    'Bytes': {
      type: DataTypes.INTEGER,
    },
  }, {
    tableName: 'tracks',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('playlist_track', {
    'PlaylistId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'TrackId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
  }, {
    tableName: 'playlist_track',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


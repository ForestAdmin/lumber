'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('artists', {
    'Name': {
      type: DataTypes.STRING,
    },
    'ArtistId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
  }, {
    tableName: 'artists',

    timestamps: false,

  });

  Model.associate = (models) => {
  };

  return Model;
};


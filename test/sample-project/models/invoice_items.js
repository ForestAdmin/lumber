'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('invoice_items', {
    'InvoiceLineId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'InvoiceId': {
      type: DataTypes.INTEGER,
    },
    'TrackId': {
      type: DataTypes.INTEGER,
    },
    'Quantity': {
      type: DataTypes.INTEGER,
    },
  }, {
    tableName: 'invoice_items',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('invoices', {
    'BillingPostalCode': {
      type: DataTypes.STRING,
    },
    'BillingCountry': {
      type: DataTypes.STRING,
    },
    'BillingState': {
      type: DataTypes.STRING,
    },
    'BillingCity': {
      type: DataTypes.STRING,
    },
    'BillingAddress': {
      type: DataTypes.STRING,
    },
    'InvoiceDate': {
      type: DataTypes.DATE,
    },
    'CustomerId': {
      type: DataTypes.INTEGER,
    },
    'InvoiceId': {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
  }, {
    tableName: 'invoices',

    timestamps: false,

  });

  Model.associate = (models) => {
  };

  return Model;
};


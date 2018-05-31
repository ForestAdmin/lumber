'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('customers', {
    'CustomerId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'FirstName': {
      type: DataTypes.STRING,
    },
    'LastName': {
      type: DataTypes.STRING,
    },
    'Company': {
      type: DataTypes.STRING,
    },
    'Address': {
      type: DataTypes.STRING,
    },
    'City': {
      type: DataTypes.STRING,
    },
    'State': {
      type: DataTypes.STRING,
    },
    'Country': {
      type: DataTypes.STRING,
    },
    'PostalCode': {
      type: DataTypes.STRING,
    },
    'Phone': {
      type: DataTypes.STRING,
    },
    'Fax': {
      type: DataTypes.STRING,
    },
    'Email': {
      type: DataTypes.STRING,
    },
    'SupportRepId': {
      type: DataTypes.INTEGER,
    },
  }, {
    tableName: 'customers',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


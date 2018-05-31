'use strict';

module.exports = (sequelize, DataTypes) => {
  var Model = sequelize.define('employees', {
    'EmployeeId': {
      type: DataTypes.INTEGER,
      primaryKey: true 
    },
    'LastName': {
      type: DataTypes.STRING,
    },
    'FirstName': {
      type: DataTypes.STRING,
    },
    'Title': {
      type: DataTypes.STRING,
    },
    'ReportsTo': {
      type: DataTypes.INTEGER,
    },
    'BirthDate': {
      type: DataTypes.DATE,
    },
    'HireDate': {
      type: DataTypes.DATE,
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
  }, {
    tableName: 'employees',
    
    timestamps: false,
    
  });

  Model.associate = (models) => {
  };

  return Model;
};


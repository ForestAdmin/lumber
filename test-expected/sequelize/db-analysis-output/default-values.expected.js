const Sequelize = require('sequelize');

module.exports = {
  "defaultValues": {
    "fields": [
      {
        "name": "noDefault",
        "nameColumn": "noDefault",
        "type": "STRING",
        "primaryKey": false,
        "defaultValue": null,
        "hasParenthesis": false
      },
      {
        "name": "arrayDefault",
        "nameColumn": "arrayDefault",
        "type": "ARRAY(DataTypes.INTEGER)",
        "defaultValue": [],
        "hasParenthesis": false
      },
      {
        "name": "booleanDefault",
        "nameColumn": "booleanDefault",
        "type": "BOOLEAN",
        "primaryKey": false,
        "defaultValue": true,
        "hasParenthesis": false
      },
      {
        "name": "dateConstDefault",
        "nameColumn": "dateConstDefault",
        "type": "DATE",
        "primaryKey": false,
        "defaultValue": "1983-05-27",
        "hasParenthesis": false
      },
      {
        "name": "dateExprDefault",
        "nameColumn": "dateExprDefault",
        "type": "DATE",
        "primaryKey": false,
        "defaultValue": Sequelize.literal('now()'),
        "hasParenthesis": false
      },
      {
        "name": "enumDefault",
        "nameColumn": "enumDefault",
        "type": "ENUM('LEFT','RIGHT')",
        "defaultValue": "LEFT",
        "hasParenthesis": false
      },
      {
        "name": "intDefault",
        "nameColumn": "intDefault",
        "type": "INT",
        "primaryKey": false,
        "defaultValue": 42,
        "hasParenthesis": false
      },
      {
        "name": 'numericWithStringNULLDefault',
        "nameColumn": 'numericWithStringNULLDefault',
        "type": 'DOUBLE',
        "primaryKey": false,
        "defaultValue": 'NULL',
        "hasParenthesis": false
      },
      {
        "name": "jsonDefault",
        "nameColumn": "jsonDefault",
        "type": "JSONB",
        "primaryKey": false,
        "defaultValue": [
          {
            "key": "one",
            "isValid": true
          },
          {
            "key": "another",
            "count": 21
          },
          {
            "key": "last",
            "value": "string value"
          }
        ],
        "hasParenthesis": false
      },
      {
        "name": "stringDefault",
        "nameColumn": "stringDefault",
        "type": "STRING",
        "primaryKey": false,
        "defaultValue": "default value",
        "hasParenthesis": false
      }
    ],
    "references": [
    ],
    "primaryKeys": ["id"],
    "options": {
      "hasIdColumn": true,
      "hasPrimaryKeys": true,
      "isJunction": false,
      "timestamps": false,
      "underscored": false
    }
  }
}

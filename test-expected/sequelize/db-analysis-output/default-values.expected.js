const Sequelize = require('sequelize');

module.exports = {
  "defaultValues": {
    "fields": [
      {
        "name": "noDefault",
        "nameColumn": "noDefault",
        "type": "STRING",
        "primaryKey": false,
        "defaultValue": null
      },
      {
        "name": "arrayDefault",
        "nameColumn": "arrayDefault",
        "type": "ARRAY(DataTypes.INTEGER)",
        "defaultValue": []
      },
      {
        "name": "booleanDefault",
        "nameColumn": "booleanDefault",
        "type": "BOOLEAN",
        "primaryKey": false,
        "defaultValue": true,
      },
      {
        "name": "dateConstDefault",
        "nameColumn": "dateConstDefault",
        "type": "DATE",
        "primaryKey": false,
        "defaultValue": "1983-05-27"
      },
      {
        "name": "dateExprDefault",
        "nameColumn": "dateExprDefault",
        "type": "DATE",
        "primaryKey": false,
        "defaultValue": Sequelize.literal('now()')
      },
      {
        "name": "enumDefault",
        "nameColumn": "enumDefault",
        "type": "ENUM('LEFT','RIGHT')",
        "defaultValue": "LEFT"
      },
      {
        "name": "intDefault",
        "nameColumn": "intDefault",
        "type": "INT",
        "primaryKey": false,
        "defaultValue": 42
      },
      {
        "name": 'numericWithStringNULLDefault',
        "nameColumn": 'numericWithStringNULLDefault',
        "type": 'DOUBLE',
        "primaryKey": false,
        "defaultValue": 'NULL',
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
        ]
      },
      {
        "name": "stringDefault",
        "nameColumn": "stringDefault",
        "type": "STRING",
        "primaryKey": false,
        "defaultValue": "default value"
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

const Sequelize = require('sequelize');

module.exports = {
  default_values: {
    fields: [
      {
        name: "boolNull",
        nameColumn: "bool_null",
        type: "BOOLEAN",
        primaryKey: false,
        defaultValue: null,
        isRequired: false,
      },
      {
        name: "boolCst",
        nameColumn: "bool_cst",
        type: "BOOLEAN",
        primaryKey: false,
        defaultValue: true,
        isRequired: false,
      },
      {
        name: "intCst",
        nameColumn: "int_cst",
        type: "INTEGER",
        primaryKey: false,
        defaultValue: 42,
        isRequired: false,
      },
      {
        name: "strNull",
        nameColumn: "str_null",
        type: "STRING",
        primaryKey: false,
        defaultValue: null,
        isRequired: false,
      },
      {
        name: "strCst",
        nameColumn: "str_cst",
        type: "STRING",
        primaryKey: false,
        defaultValue: 'co\'nst\'ant',
        isRequired: false,
      },
      {
        name: "strExpr",
        nameColumn: "str_expr",
        type: "STRING",
        primaryKey: false,
        defaultValue: Sequelize.literal("upper(concat('Hello','World'))"),
        isRequired: false,
      },
      {
        name: "dateNull",
        nameColumn: "date_null",
        type: "DATE",
        primaryKey: false,
        defaultValue: null,
        isRequired: false,
      },
      {
        name: "dateCst1",
        nameColumn: "date_cst1",
        type: "DATE",
        primaryKey: false,
        defaultValue: '2015-05-11 13:01:01',
        isRequired: false,
      },
      {
        name: "dateCst2",
        nameColumn: "date_cst2",
        type: "DATE",
        primaryKey: false,
        defaultValue: '1983-05-27',
        isRequired: false,
      },
      {
        name: "dateExpr1",
        nameColumn: "date_expr1",
        type: "DATE",
        primaryKey: false,
        defaultValue: Sequelize.literal("getutcdate()"),
        isRequired: false,
      },
      {
        name: "dateExpr2",
        nameColumn: "date_expr2",
        type: "DATE",
        primaryKey: false,
        defaultValue: Sequelize.literal("getdate()"),
        isRequired: false,
      }
    ],
    primaryKeys: [
      "id",
    ],
    options: {
      underscored: false,
      timestamps: false,
      hasIdColumn: true,
      hasPrimaryKeys: true,
      isJunction: false,
    },
    references: [
    ],
  }
};

// This model was generated by Lumber. However, you remain in control of your models.
// Learn how here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models
module.exports = (sequelize, DataTypes) => {
  const { Sequelize } = sequelize;
  // This section contains the fields of your model, mapped to your table's columns.
  // Learn more here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models#declaring-a-new-field-in-a-model
  const DefaultValues = sequelize.define('defaultValues', {
    noDefault: {
      type: DataTypes.STRING,
    },
    arrayDefault: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
    },
    booleanDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    dateConstDefault: {
      type: DataTypes.DATE,
      defaultValue: "1983-05-27",
    },
    dateExprDefault: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('now()'),
    },
    enumDefault: {
      type: DataTypes.ENUM('LEFT','RIGHT'),
      defaultValue: "LEFT",
    },
    intDefault: {
      type: DataTypes.INT,
      defaultValue: 42,
    },
    numericWithStringNULLDefault: {
      type: DataTypes.DOUBLE,
      defaultValue: "NULL",
    },
    jsonDefault: {
      type: DataTypes.JSONB,
      defaultValue: [{"key":"one","isValid":true},{"key":"another","count":21},{"key":"last","value":"string value"}],
    },
    stringDefault: {
      type: DataTypes.STRING,
      defaultValue: "default value",
    },
  }, {
    tableName: 'defaultValues',
    timestamps: false,
    schema: process.env.DATABASE_SCHEMA,
  });

  // This section contains the relationships for this model. See: https://docs.forestadmin.com/documentation/v/v6/reference-guide/relationships#adding-relationships.
  DefaultValues.associate = (models) => {
  };

  return DefaultValues;
};

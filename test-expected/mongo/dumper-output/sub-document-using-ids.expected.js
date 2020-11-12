// This model was generated by Lumber. However, you remain in control of your models.
// Learn how here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models

// This section contains the properties of your model, mapped to your collection's properties.
// Learn more here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models#declaring-a-new-field-in-a-model
module.exports = (mongoose, Mongoose) => {
  const schema = Mongoose.Schema({
    'name': String,
    'propArrayOfObjects': [{
      sampleValue: String,
    }],
  }, {
    timestamps: false,
  });
  return mongoose.model('persons', schema, 'persons');
};

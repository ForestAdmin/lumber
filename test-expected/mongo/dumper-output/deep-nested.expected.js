// This model was generated by Lumber. However, you remain in control of your models.
// Learn how here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models

// This section contains the properties of your model, mapped to your collection's properties.
// Learn more here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models#declaring-a-new-field-in-a-model
module.exports = (mongoose, Mongoose) => {
  const schema = Mongoose.Schema({
    'name': String,
    'very': {
      deep: {
        model: {
          arrayOfNumber: [Number],
          arrayMixed: [Object],
          arrayOfObjectIds: [Mongoose.Schema.Types.ObjectId],
          arrayWithComplexObject: [{
            name: String,
            propGroup: {
              answer: Boolean,
              date: Date,
              sentence: String,
              number: Number,
            },
          }],
          arrayOfComplexObjects: [{
            propGroup: {
              answer: Boolean,
              date: Date,
              sentence: String,
              number: Number,
            },
            so: {
              nested: {
                arrayMixed: [Object],
                arrayOfNumber: [Number],
              },
            },
          }],
        },
      },
    },
  }, {
    timestamps: false,
  });
  return mongoose.model('persons', schema, 'persons');
};

// This model was generated by Lumber. However, you remain in control of your models.
// Learn how here: https://docs.forestadmin.com/documentation/v/v5/reference-guide/models/enrich-your-models
const mongoose = require('mongoose');

// This section contains the properties of your model, mapped to your collection's properties.
// Learn more here: https://docs.forestadmin.com/documentation/v/v5/reference-guide/models/enrich-your-models#declaring-a-new-field-in-a-model
const schema = mongoose.Schema({
  'name': String,
  'propArrayOfObjects': [{
    // _id: false, Ambiguous usage of _ids, we could not detect if subDocuments use _id or not.
    sampleValue: String,
  }],
}, {
  timestamps: false,
});

module.exports = mongoose.model('persons', schema, 'persons');

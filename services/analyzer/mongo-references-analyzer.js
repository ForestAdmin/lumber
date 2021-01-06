const _ = require('lodash');
const P = require('bluebird');
const {
  findCollectionMatchingSamples,
  filterReferenceCollection,
} = require('../../utils/mongo-collections');

const OBJECT_ID = 'Mongoose.Schema.Types.ObjectId';
const SAMPLE_COUNT_TO_FETCH = 10;

const pickSampleValues = (databaseConnection, collectionName, field) =>
  databaseConnection.collection(collectionName)
    .aggregate([
      { $match: { [field.name]: { $ne: null } } },
      { $sample: { size: SAMPLE_COUNT_TO_FETCH } },
      { $project: { _id: false, value: `$${field.name}` } },
    ])
    .toArray()
    .then((samples) => _.map(samples, 'value'));

const buildReference = (collectionName, referencedCollection, field) => {
  if (referencedCollection) {
    return {
      from: { collectionName, fieldName: field.name },
      to: { collectionName: referencedCollection },
    };
  }
  return null;
};

const detectReference = (databaseConnection, field, collectionName) =>
  pickSampleValues(databaseConnection, collectionName, field)
    .then((samples) => findCollectionMatchingSamples(databaseConnection, samples))
    .then((matches) => filterReferenceCollection(matches))
    .then((referencedCollection) => buildReference(collectionName, referencedCollection, field));

const detectReferences = (databaseConnection, fields, collectionName) => {
  const objectIdFields = fields.filter((field) => field.type === OBJECT_ID);
  return P.mapSeries(
    objectIdFields,
    (objectIdField) => detectReference(databaseConnection, objectIdField, collectionName),
  ).then((references) => references.filter((reference) => reference));
};

const applyReferences = (fields, references) =>
  references.forEach((reference) => {
    const field = _.find(fields, { name: reference.from.fieldName });
    field.ref = reference.to.collectionName;
  });

module.exports = { detectReferences, applyReferences };

const _ = require('lodash');
const P = require('bluebird');
const {
  findCollectionMatchingSamples,
  filterReferenceCollection,
} = require('../../utils/mongo-collections');

const OBJECT_ID_ARRAY = '[Mongoose.Schema.Types.ObjectId]';
const SAMPLE_COUNT_TO_FETCH = 10;
const SAMPLE_COUNT_TO_FETCH_ARRAY = 5;

const pickSampleValues = (databaseConnection, collectionName, field) =>
  databaseConnection.collection(collectionName)
    .aggregate([
      { $project: { [field.name]: { $slice: [`$${field.name}`, SAMPLE_COUNT_TO_FETCH_ARRAY] } } },
      { $match: { [field.name]: { $ne: null } } },
      { $sample: { size: SAMPLE_COUNT_TO_FETCH } },
      { $unwind: `$${field.name}` },
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

const detectHasMany = (databaseConnection, fields, collectionName) => {
  const objectIdFields = fields.filter((field) => field.type === OBJECT_ID_ARRAY);
  return P.mapSeries(
    objectIdFields,
    (objectIdField) => detectReference(databaseConnection, objectIdField, collectionName),
  ).then((references) => references.filter((reference) => reference));
};

const applyHasMany = (fields, references) =>
  references.forEach((reference) => {
    const field = _.find(fields, { name: reference.from.fieldName });
    field.ref = reference.to.collectionName;
    field.hasMany = true;
  });

module.exports = { detectHasMany, applyHasMany };

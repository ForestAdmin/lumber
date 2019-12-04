const _ = require('lodash');
const P = require('bluebird');

const OBJECT_ID = 'mongoose.Schema.Types.ObjectId';
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

const findCollectionMatchingSamples = async (databaseConnection, collectionName, samples) =>
  P.mapSeries(databaseConnection.collections(), async (collection) => {
    const count = await collection.countDocuments({ _id: { $in: samples } });
    if (count) {
      return collection.s.namespace.collection;
    }
    return null;
  }).then((matches) => _.filter(matches, (match) => match));

const buildReference = (collectionName, referencedCollection, field) => {
  if (referencedCollection) {
    return {
      from: { collectionName, fieldName: field.name },
      to: { collectionName: referencedCollection },
    };
  }
  return null;
};

const filterReferenceCollection = (collectionName, field, referencedCollections) => {
  switch (referencedCollections.length) {
    case 0:
      return null;
    case 1:
      return referencedCollections[0];
    default:
      return null;
  }
};

const detectReference = (databaseConnection, field, collectionName) =>
  pickSampleValues(databaseConnection, collectionName, field)
    .then((samples) => findCollectionMatchingSamples(databaseConnection, collectionName, samples))
    .then((matches) => filterReferenceCollection(collectionName, field, matches))
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
    field.refTable = reference.to.collectionName;
  });

module.exports = { detectReferences, applyReferences };

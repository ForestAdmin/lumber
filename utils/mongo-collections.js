const P = require('bluebird');

function getCollectionName(collection) {
  return collection
    && collection.s
    && collection.s.namespace
    && collection.s.namespace.collection;
}

function isSystemCollection(collection) {
  const collectionName = getCollectionName(collection);
  return collectionName && collectionName.startsWith('system.');
}

async function findCollectionMatchingSamples(databaseConnection, samples) {
  return P.mapSeries(databaseConnection.collections(), async (collection) => {
    if (isSystemCollection(collection)) return null;
    const count = await collection.countDocuments({ _id: { $in: samples } });
    if (count) {
      return collection.s.namespace.collection;
    }
    return null;
  }).then((matches) => matches.filter((match) => match));
}

function filterReferenceCollection(referencedCollections) {
  return referencedCollections.length === 1 ? referencedCollections[0] : null;
}

module.exports = {
  findCollectionMatchingSamples,
  isSystemCollection,
  filterReferenceCollection,
  getCollectionName,
};

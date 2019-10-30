const _ = require('lodash');
const logger = require('./logger');
const P = require('bluebird');
const { DatabaseAnalyzerError } = require('../utils/errors');
const { detectReferences, applyReferences } = require('./analyze-mongo-references');

function isUnderscored(fields) {
  return fields.every(field => field.nameColumn === _.snakeCase(field.nameColumn))
    && fields.some(field => field.nameColumn.includes('_'));
}

const mapReduceOptions = {
  out: { inline: 1 },
  limit: 100,
};

// eslint-disable no-undef
function mapCollection() {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in this) {
    /* eslint-disable no-undef */
    if (this[key] instanceof ObjectId && key !== '_id') {
      emit(key, 'mongoose.Schema.Types.ObjectId');
    } else if (this[key] instanceof Date) {
      emit(key, 'Date');
    } else if (typeof this[key] === 'boolean') {
      emit(key, 'Boolean');
    } else if (typeof this[key] === 'string') {
      emit(key, 'String');
    } else if (typeof this[key] === 'number' && key !== '__v') {
      emit(key, 'Number');
      /* eslint-enable no-undef */
    }
  }
}

function reduceCollection(key, stuff) {
  return stuff.length ? stuff[0] : null;
}

const mapReduceErrors = (resolve, reject, collectionName) => (err, results) => {
  /* eslint-enable */
  if (err) {
    if (err.message && err.message.startsWith('CMD_NOT_ALLOWED')) {
      logger.warn(`⚠️  [${collectionName}] CMD_NOT_ALLOWED: mapReduce. Please, write manually the Mongoose fields on this collection.  ⚠️`);
      logger.warn('If your database is hosted on MongoDB Atlas, it\'s probably due to the Free tier limitations. More info here: https://docs.atlas.mongodb.com/unsupported-commands\n');
      return resolve([]);
    }
    if (err.codeName && err.codeName === 'CommandNotSupportedOnView') {
      // NOTICE: Silently ignore views errors (e.g do not import views).
      //         See: https://github.com/ForestAdmin/lumber/issues/265
      return resolve([]);
    }
    return reject(err);
  }
  /* eslint no-underscore-dangle: off */
  return resolve(results.map(r => ({ name: r._id, type: r.value })));
};

function analyzeMongoCollection(databaseConnection, collectionName) {
  return new Promise((resolve, reject) => {
    databaseConnection.collection(collectionName)
      .mapReduce(
        mapCollection,
        reduceCollection,
        mapReduceOptions,
        mapReduceErrors(resolve, reject, collectionName),
      );
  });
}

function analyzeMongoCollections(databaseConnection) {
  const schema = {};

  return databaseConnection.collections()
    .then(async (collections) => {
      if (collections.length === 0) {
        throw new DatabaseAnalyzerError.EmptyDatabase('no collections found', {
          orm: 'mongoose',
          dialect: 'mongodb',
        });
      }

      return P.each(collections, async (item) => {
        const collection = item.s;
        const collectionName = collection && collection.namespace
          && collection.namespace.collection;

        // NOTICE: Defensive programming
        if (!collectionName) {
          return;
        }

        // NOTICE: Ignore system collections.
        if (collectionName.startsWith('system.')) {
          return;
        }

        const analysis = await analyzeMongoCollection(databaseConnection, collectionName);
        const references = await detectReferences(databaseConnection, analysis, collectionName);
        applyReferences(analysis, references);
        schema[collectionName] = {
          fields: analysis,
          references: [],
          primaryKeys: ['_id'],
          options: {
            timestamps: isUnderscored(analysis),
          },
        };
      });
    })
    .then(() => schema);
}

module.exports = analyzeMongoCollections;

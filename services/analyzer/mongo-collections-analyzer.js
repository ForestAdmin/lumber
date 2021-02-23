const P = require('bluebird');
const logger = require('../logger');
const EmptyDatabaseError = require('../../utils/errors/database/empty-database-error');
const { detectReferences, applyReferences } = require('./mongo-references-analyzer');
const { detectHasMany, applyHasMany } = require('./mongo-hasmany-analyzer');
const { isUnderscored } = require('../../utils/fields');
const {
  getMongooseTypeFromValue,
  isOfMongooseType,
} = require('../../utils/mongo-primitive-type');
const {
  isSystemCollection,
  getCollectionName,
} = require('../../utils/mongo-collections');
const {
  getMongooseArraySchema,
  getMongooseEmbeddedSchema,
  getMongooseSchema,
  haveSameEmbeddedType,
  hasEmbeddedTypes,
  mergeAnalyzedSchemas,
} = require('./mongo-embedded-analyzer');

const mapReduceOptions = {
  out: { inline: 1 },
  limit: 100,
  scope: {
    getMongooseArraySchema,
    getMongooseEmbeddedSchema,
    getMongooseSchema,
    getMongooseTypeFromValue,
    haveSameEmbeddedType,
    hasEmbeddedTypes,
    isOfMongooseType,
  },
};

// NOTICE: This code runs on the MongoDB side (mapReduce feature).
//         The supported JS version is not the same than elsewhere.
//         The code used here must work with MongoDB lower version supported.
/* eslint-disable vars-on-top, no-var, no-undef, no-restricted-syntax,
                  sonarjs/cognitive-complexity */
/* istanbul ignore next */
function mapCollection() {
  function allItemsAreObjectIDs(array) {
    if (!array.length) return false;
    var itemToCheckCount = array.length > 3 ? 3 : array.length;
    var arrayOfObjectIDs = true;
    for (var i = 0; i < itemToCheckCount; i += 1) {
      if (!(array[i] instanceof ObjectId)) {
        arrayOfObjectIDs = false;
        break;
      }
    }
    return arrayOfObjectIDs;
  }

  for (var key in this) {
    if (this[key] instanceof ObjectId && key !== '_id') {
      emit(key, 'Mongoose.Schema.Types.ObjectId');
    } else if (this[key] instanceof Date) {
      emit(key, 'Date');
    } else if (typeof this[key] === 'boolean') {
      emit(key, 'Boolean');
    } else if (typeof this[key] === 'string') {
      emit(key, 'String');
    } else if (typeof this[key] === 'number' && key !== '__v') {
      emit(key, 'Number');
    } else if (typeof this[key] === 'object') {
      if (Array.isArray(this[key]) && allItemsAreObjectIDs(this[key])) {
        emit(key, '[Mongoose.Schema.Types.ObjectId]');
      } else if (key !== '_id') {
        var analysis = getMongooseSchema(this[key]);
        if (analysis) {
          // Notice: Wrap the analysis of embedded in a recognizable object for further treatment
          emit(key, { type: 'embedded', schema: analysis });
        }
      }
    }
  }
}
/* eslint-enable */

/* istanbul ignore next */
function reduceCollection(key, analyses) {
  if (hasEmbeddedTypes(analyses)) {
    const formatedAnalysis = { type: 'embedded', schemas: [] };
    analyses.forEach((analysis) => {
      if (analysis.type === 'embedded') {
        formatedAnalysis.schemas.push(analysis.schema);
      } else {
        formatedAnalysis.schemas.push(analysis);
      }
    });
    return formatedAnalysis;
  }

  return analyses.length ? analyses[0] : null;
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

  return resolve(results.map((r) => {
    if (r.value && r.value.type === 'embedded') {
      const schemas = r.value.schemas ? r.value.schemas : [r.value.schema];
      const mergedSchema = mergeAnalyzedSchemas(schemas);

      return { name: r._id, type: mergedSchema };
    }
    return { name: r._id, type: r.value };
  }));
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
        throw new EmptyDatabaseError('no collections found', {
          orm: 'mongoose',
          dialect: 'mongodb',
        });
      }

      return P.each(collections, async (collection) => {
        const collectionName = getCollectionName(collection);

        // Ignore system collections and collection without a valid name.
        if (!collectionName || isSystemCollection(collection)) {
          return;
        }

        const analysis = await analyzeMongoCollection(databaseConnection, collectionName);
        const references = await detectReferences(databaseConnection, analysis, collectionName);
        applyReferences(analysis, references);
        const hasMany = await detectHasMany(databaseConnection, analysis, collectionName);
        applyHasMany(analysis, hasMany);
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

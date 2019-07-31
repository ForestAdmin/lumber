const _ = require('lodash');
const P = require('bluebird');
const logger = require('./logger');
const ColumnTypeGetter = require('./column-type-getter');
const TableForeignKeysAnalyzer = require('./table-foreign-keys-analyzer');

function DatabaseAnalyzer(databaseConnection, config) {
  let queryInterface;
  let tableForeignKeysAnalyzer;
  let columnTypeGetter;

  function analyzeFields(table) {
    return queryInterface.describeTable(table, { schema: config.dbSchema });
  }

  async function analyzePrimaryKeys(schema) {
    return Object.keys(schema).filter(column => schema[column].primaryKey);
  }

  function analyzeTable(table) {
    return P
      .resolve(analyzeFields(table))
      .then(schema => P.all([
        schema,
        tableForeignKeysAnalyzer.perform(table),
        analyzePrimaryKeys(schema),
      ]))
      .spread(async (schema, foreignKeys, primaryKeys) => {
        const fields = [];
        const references = [];

        await P.each(Object.keys(schema), async (columnName) => {
          const columnInfo = schema[columnName];
          const type = await columnTypeGetter.perform(columnInfo, columnName);
          const foreignKey = _.find(foreignKeys, { column_name: columnName });

          if (foreignKey && foreignKey.foreign_table_name &&
            foreignKey.column_name && !columnInfo.primaryKey) {
            const ref = {
              ref: foreignKey.foreign_table_name,
              foreignKey: foreignKey.column_name,
              as: `_${foreignKey.column_name}`,
            };

            if (foreignKey.foreign_column_name !== 'id') {
              ref.targetKey = foreignKey.foreign_column_name;
            }

            references.push(ref);
          } else if (type && columnName !== 'id') {
            const opts = { name: columnName, type, primaryKey: columnInfo.primaryKey };
            fields.push(opts);
          }
        });

        return [fields, references, primaryKeys];
      });
  }

  async function sequelizeTableAnalyzer() {
    const schema = {};

    queryInterface = databaseConnection.getQueryInterface();
    tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection, config);
    columnTypeGetter = new ColumnTypeGetter(databaseConnection);

    // Build the db schema.
    await P.mapSeries(queryInterface.showAllTables({
      schema: config.dbSchema,
    }), async (table) => {
      // NOTICE: MS SQL returns objects instead of strings.
      // eslint-disable-next-line no-param-reassign
      if (typeof table === 'object') { table = table.tableName; }

      const analysis = await analyzeTable(table);
      schema[table] = { fields: analysis[0], references: analysis[1], primaryKeys: analysis[2] };
    });

    if (_.isEmpty(schema)) {
      logger.error(
        'Your database is empty.',
        'Please, create some tables before running generate command.',
      );
      return process.exit(1);
    }

    return schema;
  }

  function analyzeMongoCollection(collection) {
    return new P((resolve, reject) => {
      databaseConnection.collection(collection.name)
        /* eslint-disable */
        .mapReduce(function () {
          for (var key in this) {
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
            }
          }
        }, function (key, stuff) {
          return stuff.length ? stuff[0] : null;
        }, {
          out : { inline : 1 },
          limit: 100,
        }, (err, results) => {
          /* eslint-enable */
          if (err) {
            if (err.message && err.message.startsWith('CMD_NOT_ALLOWED')) {
              logger.warn(`⚠️  [${collection.name}] CMD_NOT_ALLOWED: mapReduce. Please, write manually the Mongoose fields on this collection.  ⚠️`);
              logger.warn('If your database is hosted on MongoDB Atlas, it\'s probably due to the Free tier limitations. More info here: https://docs.atlas.mongodb.com/unsupported-commands\n');
              results = [];
            } else {
              return reject(err);
            }
          }
          /* eslint no-underscore-dangle: off */
          resolve(results.map(r => ({ name: r._id, type: r.value })));
        });
    });
  }

  function mongoTableAnalyzer() {
    const schema = {};

    return databaseConnection.collections()
      .then(collections => P.each(collections, async (item) => {
        const collection = item.s;
        // NOTICE: Ignore system collections.
        if (collection.name.startsWith('system.')) { return; }

        const analysis = await analyzeMongoCollection(collection);
        schema[collection.name] = {
          fields: analysis,
          references: [],
          primaryKeys: ['_id'],
        };
      }))
      .then(() => schema);
  }

  this.perform = async () =>
    (config.dbDialect === 'mongodb' ? mongoTableAnalyzer() : sequelizeTableAnalyzer());
}

module.exports = DatabaseAnalyzer;

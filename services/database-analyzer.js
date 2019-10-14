const _ = require('lodash');
const P = require('bluebird');
const logger = require('./logger');
const eventSender = require('./event-sender');
const ColumnTypeGetter = require('./column-type-getter');
const TableForeignKeysAnalyzer = require('./table-foreign-keys-analyzer');

function DatabaseAnalyzer(databaseConnection, config, allowWarning) {
  let queryInterface;
  let tableForeignKeysAnalyzer;
  let columnTypeGetter;

  function analyzeFields(table) {
    return queryInterface.describeTable(table, { schema: config.dbSchema });
  }

  async function analyzePrimaryKeys(schema) {
    return Object.keys(schema).filter(column => schema[column].primaryKey);
  }

  function isUnderscored(fields) {
    return fields.every(field => field.nameColumn === _.snakeCase(field.nameColumn))
      && fields.some(field => field.nameColumn.includes('_'));
  }

  function hasTimestamps(fields) {
    let hasCreatedAt = false;
    let hasUpdatedAt = false;

    fields.forEach((field) => {
      if (field.name === 'createdAt') {
        hasCreatedAt = true;
      }

      if (field.name === 'updatedAt') {
        hasUpdatedAt = true;
      }
    });

    return hasCreatedAt && hasUpdatedAt;
  }

  function formatAliasName(columnName) {
    const alias = _.camelCase(columnName);
    if (alias.endsWith('Id') && alias.length > 2) {
      return alias.substring(0, alias.length - 2);
    } else if (alias.endsWith('Uuid') && alias.length > 4) {
      return alias.substring(0, alias.length - 4);
    }
    return alias;
  }

  // NOTICE: Look for the id column in both fields and primary keys.
  function hasIdColumn(fields, primaryKeys) {
    return fields.some(field => field.name === 'id' || field.nameColumn === 'id')
      || _.includes(primaryKeys, 'id');
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

        await P.each(Object.keys(schema), async (nameColumn) => {
          const columnInfo = schema[nameColumn];
          const type = await columnTypeGetter.perform(columnInfo, nameColumn, table);
          const foreignKey = _.find(foreignKeys, { column_name: nameColumn });

          if (foreignKey
            && foreignKey.foreign_table_name
            && foreignKey.column_name
            && !columnInfo.primaryKey) {
            const reference = {
              ref: foreignKey.foreign_table_name,
              foreignKey: foreignKey.column_name,
              foreignKeyName: _.camelCase(foreignKey.column_name),
              as: formatAliasName(foreignKey.column_name),
            };

            // NOTICE: If the foreign key name and alias are the same, Sequelize will crash, we need
            //         to handle this specific scenario generating a different foreign key name.
            if (reference.foreignKeyName === reference.as) {
              reference.foreignKeyName = `${reference.foreignKeyName}Key`;
            }

            if (foreignKey.foreign_column_name !== 'id') {
              reference.targetKey = foreignKey.foreign_column_name;
            }

            references.push(reference);
          } else if (type) {
            // NOTICE: If the column is of integer type, named "id" and primary, Sequelize will
            //         handle it automatically without necessary declaration.
            if (!(nameColumn === 'id' && type === 'INTEGER' && columnInfo.primaryKey)) {
              const field = {
                name: _.camelCase(nameColumn),
                nameColumn,
                type,
                primaryKey: columnInfo.primaryKey,
                defaultValue: columnInfo.defaultValue,
              };

              fields.push(field);
            }
          }
        });

        const options = {
          underscored: isUnderscored(fields),
          timestamps: hasTimestamps(fields),
          hasIdColumn: hasIdColumn(fields, primaryKeys),
          hasPrimaryKeys: !_.isEmpty(primaryKeys),
        };

        return {
          fields,
          references,
          primaryKeys,
          options,
        };
      });
  }

  async function sequelizeTableAnalyzer() {
    const schema = {};

    queryInterface = databaseConnection.getQueryInterface();
    tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection, config);
    columnTypeGetter = new ColumnTypeGetter(databaseConnection, config.dbSchema || 'public', allowWarning);

    // Build the db schema.
    await P.mapSeries(queryInterface.showAllTables({
      schema: config.dbSchema,
    }), async (table) => {
      // NOTICE: MS SQL returns objects instead of strings.
      // eslint-disable-next-line no-param-reassign
      if (typeof table === 'object') { table = table.tableName; }

      schema[table] = await analyzeTable(table);
    });

    if (_.isEmpty(schema)) {
      logger.error(
        'Your database is empty.',
        'Please, create some tables before running generate command.',
      );
      await eventSender.notifyError('database_empty', 'Your database is empty.', {
        orm: 'sequelize',
        dialect: databaseConnection.getDialect(),
      });
      return process.exit(1);
    }

    return schema;
  }

  function analyzeMongoCollection(collectionName) {
    return new P((resolve, reject) => {
      databaseConnection.collection(collectionName)
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
          out: { inline: 1 },
          limit: 100,
        }, (err, results) => {
          /* eslint-enable */
          if (err) {
            if (err.message && err.message.startsWith('CMD_NOT_ALLOWED')) {
              logger.warn(`⚠️  [${collectionName}] CMD_NOT_ALLOWED: mapReduce. Please, write manually the Mongoose fields on this collection.  ⚠️`);
              logger.warn('If your database is hosted on MongoDB Atlas, it\'s probably due to the Free tier limitations. More info here: https://docs.atlas.mongodb.com/unsupported-commands\n');
              return resolve([]);
            }
            return reject(err);
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
        const collectionName = collection && collection.namespace
          && collection.namespace.collection;

        // NOTICE: Defensive programming
        if (!collectionName) { return; }

        // NOTICE: Ignore system collections.
        if (collectionName.startsWith('system.')) { return; }

        const analysis = await analyzeMongoCollection(collectionName);
        schema[collectionName] = {
          fields: analysis,
          references: [],
          primaryKeys: ['_id'],
          options: {
            timestamps: isUnderscored(analysis),
          },
        };
      }))
      .then(() => schema);
  }

  this.perform = async () =>
    (config.dbDialect === 'mongodb' ? mongoTableAnalyzer() : sequelizeTableAnalyzer());
}

module.exports = DatabaseAnalyzer;

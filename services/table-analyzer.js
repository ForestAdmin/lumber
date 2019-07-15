const _ = require('lodash');
const P = require('bluebird');
const logger = require('./logger');

function TableAnalyzer(db, config) {
  let queryInterface;

  function analyzeFields(table) {
    return queryInterface.describeTable(table, { schema: config.dbSchema });
  }

  function analyzeForeignKeys(table) {
    let query = null;

    switch (queryInterface.sequelize.options.dialect) {
      case 'postgres':
        query = `SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${table}';`;
        break;
      case 'mysql':
        query = `SELECT TABLE_NAME AS table_name,COLUMN_NAME AS column_name,CONSTRAINT_NAME AS constraint_name, REFERENCED_TABLE_NAME AS foreign_table_name,REFERENCED_COLUMN_NAME AS foreign_column_name FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '${config.dbName}' AND TABLE_NAME = '${table}';`;
        break;
      case 'mssql':
        query = `SELECT fk.name AS constraint_name, OBJECT_NAME(fk.parent_object_id) AS table_name, c1.name AS column_name, OBJECT_NAME(fk.referenced_object_id) AS foreign_table_name, c2.name AS foreign_column_name FROM sys.foreign_keys fk INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id INNER JOIN sys.columns c1 ON fkc.parent_column_id = c1.column_id AND fkc.parent_object_id = c1.object_id INNER JOIN sys.columns c2 ON fkc.referenced_column_id = c2.column_id AND fkc.referenced_object_id = c2.object_id WHERE fk.parent_object_id = (SELECT object_id FROM sys.tables WHERE name = '${table}')`;
        break;
      case 'sqlite':
        query = `PRAGMA foreign_key_list('${table}');`;
        break;
      default:
        break;
    }

    return queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT });
  }

  async function analyzePrimaryKeys(table) {
    const desc = await queryInterface.describeTable(table);
    return Object.keys(desc).filter(column => desc[column].primaryKey);
  }

  function isColumnTypeEnum(columnName) {
    const query = `
      SELECT i.udt_name
      FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_catalog.pg_enum e ON t.oid = e.enumtypid
      JOIN information_schema.columns i ON t.typname = i.udt_name
      WHERE i.column_name = '${columnName}'
      GROUP BY i.udt_name;
    `;

    return queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT })
      .then(result => !!result.length);
  }

  async function getType(columnInfo, columnName) {
    const { type, special } = columnInfo;
    const mysqlEnumRegex = /ENUM\((.*)\)/i;

    switch (type) {
      case 'BIT': // MSSQL type
      case 'BOOLEAN':
        return 'BOOLEAN';
      case 'CHARACTER VARYING':
      case 'TEXT':
      case 'NTEXT': // MSSQL type
      case (type.match(/TEXT.*/i) || {}).input:
      case (type.match(/VARCHAR.*/i) || {}).input:
      case (type.match(/CHAR.*/i) || {}).input:
      case 'NVARCHAR': // MSSQL type
        return 'STRING';
      case 'USER-DEFINED': {
        if (queryInterface.sequelize.options.dialect === 'postgres' &&
          await isColumnTypeEnum(columnName)) {
          return `ENUM('${special.join('\', \'')}')`;
        }

        return 'STRING';
      }
      case (type.match(mysqlEnumRegex) || {}).input:
        return type;
      case 'UNIQUEIDENTIFIER':
      case 'UUID':
        return 'UUID';
      case 'JSONB':
        return 'JSONB';
      case 'SMALLINT':
      case 'INTEGER':
      case 'SERIAL':
      case 'BIGSERIAL':
      case (type.match(/INT.*/i) || {}).input:
      case (type.match(/TINYINT.*/i) || {}).input:
        return 'INTEGER';
      case 'BIGINT':
        return 'BIGINT';
      case 'NUMERIC':
      case 'DECIMAL':
      case 'REAL':
      case 'DOUBLE PRECISION':
      case (type.match(/DECIMAL.*/i) || {}).input:
      case 'MONEY': // MSSQL type
        return 'DOUBLE';
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
      case 'TIMESTAMP WITH TIME ZONE':
      case 'TIMESTAMP WITHOUT TIME ZONE':
        return 'DATE';
      default:
        return null;
    }
  }

  function analyzeTable(table) {
    return P
      .all([analyzeFields(table), analyzeForeignKeys(table), analyzePrimaryKeys(table)])
      .spread(async (schema, foreignKeys, primaryKeys) => {
        const fields = [];
        const references = [];

        await P.each(Object.keys(schema), async (columnName) => {
          const columnInfo = schema[columnName];
          const type = await getType(columnInfo, columnName);
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

    queryInterface = db.getQueryInterface();

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
      db.collection(collection.name)
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

    return db.collections()
      .then(collections => P.each(collections, async (item) => {
        const collection = item.s;
        // NOTICE: Ignore system collections.
        if (collection.name.startsWith('system.')) { return; }

        const analysis = await analyzeMongoCollection(collection);
        schema[collection.name] = { fields: analysis, references: [], primaryKeys: ['_id'] };
      }))
      .then(() => schema);
  }

  this.perform = async () => {
    if (config.dbDialect === 'mongodb') { return mongoTableAnalyzer(); }
    return sequelizeTableAnalyzer();
  };
}

module.exports = TableAnalyzer;

const P = require('bluebird');
const fs = require('fs');
const os = require('os');
const _ = require('lodash');
const mkdirpSync = require('mkdirp');
const Handlebars = require('handlebars');
const chalk = require('chalk');
const { plural, singular } = require('pluralize');
const Sequelize = require('sequelize');
const stringUtils = require('../utils/strings');
const logger = require('./logger');
const toValidPackageName = require('../utils/to-valid-package-name');
require('../handlerbars/loader');

const mkdirp = P.promisify(mkdirpSync);

const DEFAULT_PORT = 3310;

const DEFAULT_VALUE_TYPES_TO_STRINGIFY = [
  `${Sequelize.DataTypes.ARRAY}`,
  `${Sequelize.DataTypes.CITEXT}`,
  `${Sequelize.DataTypes.DATE}`,
  `${Sequelize.DataTypes.ENUM}`,
  `${Sequelize.DataTypes.JSONB}`,
  `${Sequelize.DataTypes.STRING}`,
  `${Sequelize.DataTypes.TEXT}`,
  `${Sequelize.DataTypes.UUID}`,
];

function Dumper(config) {
  const path = `${process.cwd()}/${config.appName}`;
  const routesPath = `${path}/routes`;
  const forestPath = `${path}/forest`;
  const publicPath = `${path}/public`;
  const viewPath = `${path}/views`;
  const modelsPath = `${path}/models`;
  const middlewaresPath = `${path}/middlewares`;

  function isLinuxBasedOs() {
    return os.platform() === 'linux';
  }

  function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content);
    logger.log(`  ${chalk.green('create')} ${filePath.substring(path.length + 1)}`);
  }

  function copyTemplate(from, to) {
    const newFrom = `${__dirname}/../templates/app/${from}`;
    writeFile(to, fs.readFileSync(newFrom, 'utf-8'));
  }

  function copyHandleBarsTemplate({ source, target, context }) {
    function handlebarsTemplate(templatePath) {
      return Handlebars.compile(
        fs.readFileSync(`${__dirname}/../templates/${templatePath}`, 'utf-8'),
        { noEscape: true },
      );
    }

    if (!(source && target && context)) {
      throw new Error('Missing argument (source, target or context).');
    }

    writeFile(`${path}/${target}`, handlebarsTemplate(source)(context));
  }

  function writePackageJson() {
    const orm = config.dbDialect === 'mongodb' ? 'mongoose' : 'sequelize';
    const dependencies = {
      chalk: '~1.1.3',
      'cookie-parser': '1.4.4',
      cors: '2.8.5',
      debug: '~4.0.1',
      dotenv: '~6.1.0',
      express: '~4.16.3',
      'express-jwt': '5.3.1',
      [`forest-express-${orm}`]: '^6.0.0',
      morgan: '1.9.1',
      'require-all': '^3.0.0',
      sequelize: '~5.15.1',
    };

    if (config.dbDialect) {
      if (config.dbDialect.includes('postgres')) {
        dependencies.pg = '~6.1.0';
      } else if (config.dbDialect === 'mysql') {
        dependencies.mysql2 = '~1.7.0';
      } else if (config.dbDialect === 'mssql') {
        dependencies.tedious = '^6.4.0';
      } else if (config.dbDialect === 'mongodb') {
        delete dependencies.sequelize;
        dependencies.mongoose = '~5.8.2';
      }
    }

    const pkg = {
      name: toValidPackageName(config.appName),
      version: '0.0.1',
      private: true,
      scripts: { start: 'node ./server.js' },
      dependencies,
    };

    writeFile(`${path}/package.json`, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  function tableToFilename(table) {
    return _.kebabCase(table);
  }

  function getDatabaseUrl() {
    let connectionString;

    if (config.dbConnectionUrl) {
      connectionString = config.dbConnectionUrl;
    } else {
      let protocol = config.dbDialect;
      let port = `:${config.dbPort}`;
      let password = '';

      if (config.dbDialect === 'mongodb' && config.mongodbSrv) {
        protocol = 'mongodb+srv';
        port = '';
      }

      if (config.dbPassword) {
        // NOTICE: Encode password string in case of special chars.
        password = `:${encodeURIComponent(config.dbPassword)}`;
      }

      connectionString = `${protocol}://${config.dbUser}${password}@${config.dbHostname}${port}/${config.dbName}`;
    }

    return connectionString;
  }

  function isDatabaseLocal() {
    const databaseUrl = getDatabaseUrl();
    return databaseUrl.includes('127.0.0.1') || databaseUrl.includes('localhost');
  }

  function writeDotEnv() {
    copyHandleBarsTemplate({
      source: 'app/env.hbs',
      target: '.env',
      context: {
        databaseUrl: getDatabaseUrl(),
        ssl: config.ssl || 'false',
        dbSchema: config.dbSchema,
        hostname: config.appHostname,
        port: config.appPort || DEFAULT_PORT,
        forestEnvSecret: config.forestEnvSecret,
        forestAuthSecret: config.forestAuthSecret,
      },
    });
  }

  function getModelNameFromTableName(table) {
    return stringUtils.camelCase(stringUtils.transformToSafeString(table));
  }

  function getSafeDefaultValue(field) {
    // NOTICE: in case of SQL dialect, ensure default value is directly usable in template
    //         as a JS value.
    let safeDefaultValue = field.defaultValue;
    if (config.dbDialect !== 'mongodb') {
      if (typeof safeDefaultValue === 'object' && safeDefaultValue instanceof Sequelize.Utils.Literal) {
        safeDefaultValue = `Sequelize.literal('${safeDefaultValue.val}')`;
      } else if (
        !_.isNil(safeDefaultValue)
        && _.some(
          DEFAULT_VALUE_TYPES_TO_STRINGIFY,
          // NOTICE: Uses `startsWith` as composite types may vary (eg: `ARRAY(DataTypes.INTEGER)`)
          (dataType) => _.startsWith(field.type, dataType),
        )) {
        safeDefaultValue = JSON.stringify(safeDefaultValue);
      }
    }
    return safeDefaultValue;
  }

  function writeModel(table, fields, references, options = {}) {
    const { underscored } = options;

    const fieldsDefinition = fields.map((field) => {
      const expectedConventionalColumnName = underscored ? _.snakeCase(field.name) : field.name;
      const nameColumnUnconventional = field.nameColumn !== expectedConventionalColumnName
        || (underscored && /[1-9]/g.test(field.name));
      const safeDefaultValue = getSafeDefaultValue(field);

      return {
        ...field,
        ref: field.ref && getModelNameFromTableName(field.ref),
        nameColumnUnconventional,
        safeDefaultValue,
        // NOTICE: needed to keep falsy default values in template
        hasSafeDefaultValue: !_.isNil(safeDefaultValue),
      };
    });

    const referencesDefinition = references.map((reference) => {
      const isBelongsToMany = reference.association === 'belongsToMany';

      if (reference.targetKey) {
        const expectedConventionalTargetKeyName = underscored
          ? _.snakeCase(reference.targetKey) : _.camelCase(reference.targetKey);
        const targetKeyColumnUnconventional = reference.targetKey
          !== expectedConventionalTargetKeyName;
        return {
          ...reference,
          isBelongsToMany,
          targetKeyColumnUnconventional,
        };
      }
      return {
        ...reference,
        isBelongsToMany,
      };
    });

    copyHandleBarsTemplate({
      source: `app/models/${config.dbDialect === 'mongodb' ? 'mongo' : 'sequelize'}-model.hbs`,
      target: `models/${tableToFilename(table)}.js`,
      context: {
        modelName: getModelNameFromTableName(table),
        modelVariableName: stringUtils.pascalCase(stringUtils.transformToSafeString(table)),
        table,
        fields: fieldsDefinition,
        references: referencesDefinition,
        ...options,
        schema: config.dbSchema,
        dialect: config.dbDialect,
        noId: !options.hasIdColumn && !options.hasPrimaryKeys,
      },
    });
  }

  function writeRoute(modelName) {
    const modelNameDasherized = _.kebabCase(modelName);
    const readableModelName = _.startCase(modelName);

    copyHandleBarsTemplate({
      source: 'app/routes/route.hbs',
      target: `routes/${tableToFilename(modelName)}.js`,
      context: {
        modelName: getModelNameFromTableName(modelName),
        modelNameDasherized,
        modelNameReadablePlural: plural(readableModelName),
        modelNameReadableSingular: singular(readableModelName),
        isMongoDB: config.dbDialect === 'mongodb',
      },
    });
  }

  function writeForestCollection(table) {
    copyHandleBarsTemplate({
      source: 'app/forest/collection.hbs',
      target: `forest/${tableToFilename(table)}.js`,
      context: {
        isMongoDB: config.dbDialect === 'mongodb',
        table: getModelNameFromTableName(table),
      },
    });
  }

  function writeAppJs() {
    copyHandleBarsTemplate({
      source: 'app/app.hbs',
      target: 'app.js',
      context: {
        isMongoDB: config.dbDialect === 'mongodb',
        forestUrl: process.env.FOREST_URL,
      },
    });
  }

  function writeModelsIndex() {
    const { dbDialect } = config;

    copyHandleBarsTemplate({
      source: 'app/models/index.hbs',
      target: 'models/index.js',
      context: {
        isMongoDB: dbDialect === 'mongodb',
        isMSSQL: dbDialect === 'mssql',
        isMySQL: dbDialect === 'mysql',
      },
    });
  }

  function writeDockerfile() {
    copyHandleBarsTemplate({
      source: 'app/Dockerfile.hbs',
      target: 'Dockerfile',
      context: { port: config.appPort || DEFAULT_PORT },
    });
  }

  function writeDockerCompose() {
    copyHandleBarsTemplate({
      source: 'app/docker-compose.hbs',
      target: 'docker-compose.yml',
      context: {
        appName: config.appName,
        containerName: _.snakeCase(config.appName),
        hostname: config.appHostname || 'http://localhost',
        port: config.appPort || DEFAULT_PORT,
        databaseUrl: isLinuxBasedOs() ? getDatabaseUrl() : getDatabaseUrl().replace('localhost', 'host.docker.internal'),
        ssl: config.ssl || 'false',
        dbSchema: config.dbSchema,
        forestEnvSecret: config.forestEnvSecret,
        forestAuthSecret: config.forestAuthSecret,
        forestUrl: process.env.FOREST_URL,
        network: (isLinuxBasedOs() && isDatabaseLocal()) ? 'host' : null,
      },
    });
  }

  function writeForestAdminMiddleware() {
    copyHandleBarsTemplate({
      source: 'app/middlewares/forestadmin.hbs',
      target: 'middlewares/forestadmin.js',
      context: { isMongoDB: config.dbDialect === 'mongodb' },
    });
  }

  // NOTICE: Generate files in alphabetical order to ensure a nice generation console logs display.
  this.dump = async (schema) => {
    const directories = [
      mkdirp(path),
      mkdirp(routesPath),
      mkdirp(forestPath),
      mkdirp(viewPath),
      mkdirp(publicPath),
      mkdirp(middlewaresPath),
      mkdirp(modelsPath),
    ];

    await P.all(directories);

    const modelNames = Object.keys(schema)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    modelNames.forEach(writeForestCollection);

    writeForestAdminMiddleware();
    copyTemplate('middlewares/welcome.hbs', `${path}/middlewares/welcome.js`);

    writeModelsIndex();
    modelNames.forEach((modelName) => {
      const { fields, references, options } = schema[modelName];
      const safeReferences = references.map((reference) => ({
        ...reference,
        ref: getModelNameFromTableName(reference.ref),
      }));
      writeModel(modelName, fields, safeReferences, options);
    });

    copyTemplate('public/favicon.png', `${path}/public/favicon.png`);

    modelNames.forEach((modelName) => {
      // HACK: If a table name is "sessions" the generated routes will conflict with Forest Admin
      //       internal session creation route. As a workaround, we don't generate the route file.
      // TODO: Remove the if condition, once the routes paths refactored to prevent such conflict.
      if (modelName !== 'sessions') {
        writeRoute(modelName);
      }
    });

    copyTemplate('views/index.hbs', `${path}/views/index.html`);
    copyTemplate('dockerignore.hbs', `${path}/.dockerignore`);
    writeDotEnv();
    copyTemplate('gitignore.hbs', `${path}/.gitignore`);
    writeAppJs();
    writeDockerCompose();
    writeDockerfile();
    writePackageJson();
    copyTemplate('server.hbs', `${path}/server.js`);
  };
}

module.exports = Dumper;

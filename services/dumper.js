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
const { tableToFilename } = require('../utils/dumper-utils');
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

  function writeFile(filePath, content, type = 'create') {
    fs.writeFileSync(filePath, content);
    logger.log(`  ${chalk.green(type)} ${filePath.substring(path.length + 1)}`);
  }

  function copyTemplate(from, to) {
    const newFrom = `${__dirname}/../templates/app/${from}`;
    writeFile(to, fs.readFileSync(newFrom, 'utf-8'));
  }

  function handlebarsTemplate(templatePath) {
    return Handlebars.compile(
      fs.readFileSync(`${__dirname}/../templates/${templatePath}`, 'utf-8'),
      { noEscape: true },
    );
  }

  function copyHandleBarsTemplate({ source, target, context }) {
    if (!(source && target && context)) {
      throw new Error('Missing argument (source, target or context).');
    }

    writeFile(`${path}/${target}`, handlebarsTemplate(source)(context));
  }

  function getTableFileName(table) {
    return `${path}/models/${tableToFilename(table)}.js`;
  }

  function writePackageJson() {
    const orm = config.dbDialect === 'mongodb' ? 'mongoose' : 'sequelize';
    const dependencies = {
      'body-parser': '1.19.0',
      chalk: '~1.1.3',
      'cookie-parser': '1.4.4',
      cors: '2.8.5',
      debug: '~4.0.1',
      dotenv: '~6.1.0',
      express: '~4.17.1',
      'express-jwt': '5.3.1',
      [`forest-express-${orm}`]: '^6.0.0',
      morgan: '1.9.1',
      'require-all': '^3.0.0',
      sequelize: '~5.15.1',
    };

    if (config.dbDialect) {
      if (config.dbDialect.includes('postgres')) {
        dependencies.pg = '~8.2.2';
      } else if (config.dbDialect === 'mysql') {
        dependencies.mysql2 = '~2.2.5';
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

  function isLocalUrl(url) {
    return /^http:\/\/(?:localhost|127\.0\.0\.1)$/.test(url);
  }

  function getPort() {
    return config.appPort || DEFAULT_PORT;
  }

  function getApplicationUrl() {
    const hostUrl = /^https?:\/\//.test(config.appHostname)
      ? config.appHostname
      : `http://${config.appHostname}`;

    return isLocalUrl(hostUrl)
      ? `${hostUrl}:${getPort()}`
      : hostUrl;
  }

  function writeDotEnv() {
    const context = {
      databaseUrl: getDatabaseUrl(),
      ssl: config.ssl || 'false',
      dbSchema: config.dbSchema,
      hostname: config.appHostname,
      port: getPort(),
      forestEnvSecret: config.forestEnvSecret,
      forestAuthSecret: config.forestAuthSecret,
      hasDockerDatabaseUrl: false,
      applicationUrl: getApplicationUrl(),
    };
    if (!isLinuxBasedOs()) {
      context.dockerDatabaseUrl = getDatabaseUrl().replace('localhost', 'host.docker.internal');
      context.hasDockerDatabaseUrl = true;
    }
    copyHandleBarsTemplate({
      source: 'app/env.hbs',
      target: '.env',
      context,
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
      } else if (!_.isNil(safeDefaultValue)) {
        if (_.some(
          DEFAULT_VALUE_TYPES_TO_STRINGIFY,
          // NOTICE: Uses `startsWith` as composite types may vary (eg: `ARRAY(DataTypes.INTEGER)`)
          (dataType) => _.startsWith(field.type, dataType),
        )) {
          safeDefaultValue = JSON.stringify(safeDefaultValue);
        } else if (`${safeDefaultValue}`.toUpperCase() === 'NULL') {
          safeDefaultValue = '"NULL"';
        }
      }
    }
    return safeDefaultValue;
  }

  function getReferenceWithMetaData(reference) {
    return {
      ...reference,
      isBelongsToMany: reference.association === 'belongsToMany',
      targetKey: _.camelCase(reference.targetKey),
    };
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

    const referencesDefinition = references.map(getReferenceWithMetaData);

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
      context: {},
    });
  }

  function writeDockerCompose() {
    const databaseUrl = `\${${isLinuxBasedOs() ? 'DATABASE_URL' : 'DOCKER_DATABASE_URL'}}`;
    const forestUrl = process.env.FOREST_URL ? `\${FOREST_URL-${process.env.FOREST_URL}}` : false;
    copyHandleBarsTemplate({
      source: 'app/docker-compose.hbs',
      target: 'docker-compose.yml',
      context: {
        containerName: _.snakeCase(config.appName),
        databaseUrl,
        dbSchema: config.dbSchema,
        forestUrl,
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

  this.dumpFieldIntoModel = (tableName, field) => {
    const newFieldText = handlebarsTemplate(`app/models/update/${config.dbDialect === 'mongodb' ? 'mongo' : 'sequelize'}-field.hbs`)({ field })
      .trimRight();
    const tableFileName = getTableFileName(tableName);

    const currentContent = fs.readFileSync(tableFileName, 'utf-8');
    // NOTICE: Detect the model declaration.
    const regexp = config.dbDialect === 'mongodb'
      ? /(mongoose.Schema\({)/
      : /(sequelize.define\(\s*'.*',\s*{)/;

    if (regexp.test(currentContent)) {
      // NOTICE: Insert the field at the beginning of the fields declaration.
      const newContent = currentContent.replace(regexp, `$1\n${newFieldText}`);
      writeFile(tableFileName, newContent, 'update');
    } else {
      logger.warn(chalk.bold(`WARNING: Cannot add the field definition ${field.name} \
automatically. Please, add it manually to the file '${tableFileName}':\n${newFieldText}`));
    }
  };

  this.dumpReferenceIntoModel = (tableName, reference) => {
    const tableFileName = getTableFileName(tableName);
    const referenceWithMetaDatas = getReferenceWithMetaData(reference);

    const currentContent = fs.readFileSync(tableFileName, 'utf-8');

    // NOTICE: Find the name of the variable which store the current model.
    //         For example: const MyModel = sequelize.define(...
    //         would give you MyModel
    const regexpModelVariableName = /\s(\w+)\s*=\s*sequelize\s*\.\s*define/;
    let modelVariableName;
    if (regexpModelVariableName.test(currentContent)) {
      const matches = currentContent.match(regexpModelVariableName);
      [, modelVariableName] = matches;
    } else {
      modelVariableName = stringUtils.pascalCase(stringUtils.transformToSafeString(tableName));
    }

    const newFieldText = handlebarsTemplate('app/models/update/sequelize-relationship.hbs')({
      reference: referenceWithMetaDatas,
      modelVariableName,
    })
      .trimRight();

    const regexpAssociate = /(\.associate\s*=\s*(function)?\s*\(models\)\s*(=>)?\s*{)/;

    if (regexpAssociate.test(currentContent)) {
      // NOTICE: Insert the new relationship at the first position in the associate block.
      const newContent = currentContent.replace(regexpAssociate, `$1\n${newFieldText}`);
      writeFile(tableFileName, newContent, 'update');
    } else {
      logger.warn(chalk.bold(`WARNING: Cannot add the field definition ${reference.name} \
automatically. Please, add it manually to the file '${tableFileName}':\n${newFieldText}`));
    }
  };

  function writeRouteIfPossible(modelName) {
    // HACK: If a table name is "sessions" the generated routes will conflict with Forest Admin
    //       internal session creation route. As a workaround, we don't generate the route file.
    // TODO: Remove the if condition, once the routes paths refactored to prevent such conflict.
    if (modelName !== 'sessions') {
      writeRoute(modelName);
    }
  }

  this.removeReferenceFromModel = (tableName, foreignKeyName) => {
    const tableFileName = getTableFileName(tableName);

    const currentContent = fs.readFileSync(tableFileName, 'utf-8');
    // NOTICE: Detect the model declaration.
    const regexp = new RegExp(`\\s*\\w+\\s*\\.\\s*(belongsToMany|belongsTo|hasMany|hasOne)\\s*\\(\\s*models\\.\\w+,\\s*{\\s*[\\s\\w',:]*foreignKey:\\s*({[\\s\\w',:]*field:\\s*['"]${foreignKeyName}['"],?\\s*}|\\s*['"]${foreignKeyName}['"]),?[^}]*}\\);?`);

    if (regexp.test(currentContent)) {
      // NOTICE: Insert the field at the beginning of the fields declaration.
      const newContent = currentContent.replace(regexp, '');
      writeFile(tableFileName, newContent, 'update');
    } else {
      logger.warn(chalk.bold(`WARNING: Cannot remove the reference on ${foreignKeyName} \
automatically. Please, remove it manually from the file '${tableFileName}'`));
    }
  };

  this.removeFieldFromModel = (tableName, fieldName) => {
    const tableFileName = getTableFileName(tableName);

    const currentContent = fs.readFileSync(tableFileName, 'utf-8');
    // NOTICE: Detect the model declaration.
    const regexp = new RegExp(`\\s*['"]?${fieldName}['"]?:\\s*{\\s*[^}]*type:\\s*DataTypes..*[^}]*},?`);

    if (regexp.test(currentContent)) {
      // NOTICE: Insert the field at the beginning of the fields declaration.
      const newContent = currentContent.replace(regexp, '');
      writeFile(tableFileName, newContent, 'update');
    } else {
      logger.warn(chalk.bold(`WARNING: Cannot remove the field ${fieldName} \
automatically. Please, remove it manually from the file '${tableFileName}'`));
    }
  };

  this.removeModel = (tableName) => {
    const collectionFilePath = `${path}/forest/${tableName}`;
    const modelFilePath = `${path}/models/${tableName}`;
    const routeFilePath = `${path}/routes/${tableName}`;

    if (fs.existsSync(collectionFilePath)) {
      fs.unlinkSync(collectionFilePath);
    }
    if (fs.existsSync(routeFilePath)) {
      fs.unlinkSync(routeFilePath);
    }
    fs.unlinkSync(modelFilePath);
  };

  this.dumpModel = (tableName, tableSchema) => {
    writeForestCollection(tableName);
    const { fields, references, options } = tableSchema;
    writeModel(tableName, fields, references, options);
    writeRouteIfPossible(tableName);
  };

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
      writeRouteIfPossible(modelName);
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

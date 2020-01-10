const P = require('bluebird');
const fs = require('fs');
const _ = require('lodash');
const mkdirpSync = require('mkdirp');
const Handlebars = require('handlebars');
const chalk = require('chalk');
const { plural, singular } = require('pluralize');
const stringUtils = require('../utils/strings');
const logger = require('./logger');
require('../handlerbars/loader');

const mkdirp = P.promisify(mkdirpSync);

const DEFAULT_PORT = 3310;

function Dumper(config) {
  const path = `${process.cwd()}/${config.appName}`;
  const binPath = `${path}/bin`;
  const routesPath = `${path}/routes`;
  const forestPath = `${path}/forest`;
  const publicPath = `${path}/public`;
  const viewPath = `${path}/views`;
  const modelsPath = `${path}/models`;
  const middlewaresPath = `${path}/middlewares`;

  function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content);
    logger.log(`  ${chalk.green('create')} ${filePath.substring(path.length + 1)}`);
  }

  function copyTemplate(from, to) {
    const newFrom = `${__dirname}/../templates/app/${from}`;
    writeFile(to, fs.readFileSync(newFrom, 'utf-8'));
  }

  function handlebarsTemplate(templatePath) {
    return Handlebars.compile(
      fs.readFileSync(`${__dirname}/../templates/${templatePath}`, 'utf-8'),
    );
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
      [`forest-express-${orm}`]: '^5.5.0',
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
      name: config.appName.replace(/ /g, '_').toLowerCase(),
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

  function writeDotEnv() {
    const template = handlebarsTemplate('app/env.hbs');

    const settings = {
      databaseUrl: getDatabaseUrl(),
      ssl: config.ssl,
      dbSchema: config.dbSchema,
      hostname: config.appHostname,
      port: config.appPort,
      forestEnvSecret: config.forestEnvSecret,
      forestAuthSecret: config.forestAuthSecret,
    };

    writeFile(`${path}/.env`, template(settings));
  }

  function writeModel(table, fields, references, options = {}) {
    const templatePath = config.dbDialect === 'mongodb'
      ? `${__dirname}/../templates/app/models/mongo-model.hbs`
      : `${__dirname}/../templates/app/models/sequelize-model.hbs`;
    const template = Handlebars.compile(fs.readFileSync(templatePath, 'utf-8'));
    const { underscored } = options;

    const fieldsDefinition = fields.map((field) => {
      const expectedConventionalColumnName = underscored ? _.snakeCase(field.name) : field.name;
      const nameColumnUnconventional = field.nameColumn !== expectedConventionalColumnName
        || (underscored && /[1-9]/g.test(field.name));
      return { ...field, nameColumnUnconventional };
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

    const text = template({
      modelName: stringUtils.pascalCase(table),
      table,
      fields: fieldsDefinition,
      references: referencesDefinition,
      ...options,
      schema: config.dbSchema,
      dialect: config.dbDialect,
      noId: !options.hasIdColumn && !options.hasPrimaryKeys,
    });

    const filename = tableToFilename(table);
    writeFile(`${path}/models/${filename}.js`, text);
  }

  function writeRoute(modelName) {
    const template = handlebarsTemplate('app/routes/route.hbs');

    const modelNameDasherized = _.kebabCase(modelName);
    const readableModelName = _.startCase(modelName);
    const text = template({
      modelName,
      modelNameDasherized,
      modelNameReadablePlural: plural(readableModelName),
      modelNameReadableSingular: singular(readableModelName),
      isMongoBD: config.dbDialect === 'mongodb',
    });

    const filename = tableToFilename(modelName);
    writeFile(`${path}/routes/${filename}.js`, text);
  }

  function writeForestCollection(table) {
    const template = handlebarsTemplate('app/forest/collection.hbs');

    const text = template({ isMongoDB: config.dbDialect === 'mongodb', table });

    const filename = tableToFilename(table);
    writeFile(`${path}/forest/${filename}.js`, text);
  }

  function writeAppJs() {
    const template = handlebarsTemplate('app/app.hbs');

    const text = template({
      isMongoDB: config.dbDialect === 'mongodb',
      forestUrl: process.env.FOREST_URL,
    });

    writeFile(`${path}/app.js`, text);
  }

  function writeModelsIndex() {
    const template = handlebarsTemplate('app/models/index.hbs');

    const { dbDialect } = config;
    const text = template({
      isMongoDB: dbDialect === 'mongodb',
      isMSSQL: dbDialect === 'mssql',
      isMySQL: dbDialect === 'mysql',
    });

    writeFile(`${path}/models/index.js`, text);
  }

  function writeDockerfile() {
    const template = handlebarsTemplate('app/Dockerfile.hbs');

    const settings = {
      port: config.appPort || DEFAULT_PORT,
    };

    writeFile(`${path}/Dockerfile`, template(settings));
  }

  function writeDockerCompose() {
    const template = handlebarsTemplate('app/docker-compose.hbs');

    const settings = {
      appName: config.appName,
      containerName: _.snakeCase(config.appName),
      hostname: config.appHostname || 'http://localhost',
      port: config.appPort || DEFAULT_PORT,
      databaseUrl: getDatabaseUrl().replace('localhost', 'host.docker.internal'),
      ssl: config.ssl || 'false',
      dbSchema: config.dbSchema,
      forestEnvSecret: config.forestEnvSecret,
      forestAuthSecret: config.forestAuthSecret,
      forestUrl: process.env.FOREST_URL,
    };

    writeFile(`${path}/docker-compose.yml`, template(settings));
  }

  this.dump = async (schema) => {
    const directories = [
      mkdirp(path),
      mkdirp(binPath),
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

    writeModelsIndex(path);
    modelNames.forEach((modelName) => {
      const { fields, references, options } = schema[modelName];
      writeModel(modelName, fields, references, options);
    });

    modelNames.forEach((modelName) => {
      // HACK: If a table name is "sessions" the generated routes will conflict with Forest Admin
      //       internal session creation route. As a workaround, we don't generate the route file.
      // TODO: Remove the if condition, once the routes paths refactored to prevent such conflict.
      if (modelName !== 'sessions') {
        writeRoute(modelName);
      }
    });

    writeDotEnv();
    writeAppJs();
    writeDockerCompose();
    writeDockerfile();
    writePackageJson();

    // NOTICE: Copy simple templates files without replacements.
    copyTemplate('server.hbs', `${path}/server.js`);
    copyTemplate('views/index.hbs', `${path}/views/index.html`);
    copyTemplate('middlewares/forestadmin.hbs', `${path}/middlewares/forestadmin.js`);
    copyTemplate('middlewares/welcome.hbs', `${path}/middlewares/welcome.js`);
    copyTemplate('public/favicon.png', `${path}/public/favicon.png`);
    copyTemplate('dockerignore.hbs', `${path}/.dockerignore`);
    copyTemplate('gitignore.hbs', `${path}/.gitignore`);
  };
}

module.exports = Dumper;

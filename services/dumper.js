const P = require('bluebird');
const fs = require('fs');
const _ = require('lodash');
const mkdirpSync = require('mkdirp');
const Handlebars = require('handlebars');
const chalk = require('chalk');
const { plural, singular } = require('pluralize');
const stringUtils = require('../utils/strings');
const logger = require('./logger');

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

  function writePackageJson() {
    const orm = config.dbDialect === 'mongodb' ? 'mongoose' : 'sequelize';
    const dependencies = {
      chalk: '~1.1.3',
      'cookie-parser': '1.4.4',
      debug: '~4.0.1',
      dotenv: '~6.1.0',
      express: '~4.16.3',
      [`forest-express-${orm}`]: '^5.2.0',
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
      } else if (config.dbDialect === 'sqlite') {
        dependencies.sqlite3 = '~4.0.2';
      } else if (config.dbDialect === 'mongodb') {
        delete dependencies.sequelize;
        dependencies.mongoose = '~5.3.6';
      }
    }

    const pkg = {
      name: config.appName.replace(/ /g, '_').toLowerCase(),
      version: '0.0.1',
      private: true,
      scripts: { start: 'node ./bin/www' },
      dependencies,
    };

    writeFile(`${path}/package.json`, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  function tableToFilename(table) {
    return _.kebabCase(table);
  }

  function writeDotGitIgnore() {
    const templatePath = `${__dirname}/../templates/app/gitignore`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    writeFile(`${path}/.gitignore`, template({}));
  }

  function getDatabaseUrl() {
    let connectionString;

    if (config.dbConnectionUrl) {
      connectionString = config.dbConnectionUrl;
    } else if (config.dbDialect === 'sqlite') {
      connectionString = `sqlite://${config.dbStorage}`;
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
    const templatePath = `${__dirname}/../templates/app/env`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

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

  function writeModel(pathDest, table, fields, references, options = {}) {
    const templatePath = config.dbDialect === 'mongodb' ?
      `${__dirname}/../templates/mongo-model.hbs`
      :
      `${__dirname}/../templates/sequelize-model.hbs`;
    const template = Handlebars.compile(fs.readFileSync(templatePath, 'utf-8'));
    const { underscored } = options;

    const fieldsDefinition = fields.map((field) => {
      const expectedConventionalColumnName = underscored ? _.snakeCase(field.name) : field.name;
      const nameColumnUnconventional = field.nameColumn !== expectedConventionalColumnName
        || (underscored && /[1-9]/g.test(field.name));
      return { ...field, nameColumnUnconventional };
    });

    const referencesDefinition = references.map((reference) => {
      const expectedConventionalForeignKeyName = underscored
        ? _.snakeCase(reference.foreignKey) : reference.foreignKey;
      const foreignKeyColumnUnconventional =
        reference.foreignKeyName !== expectedConventionalForeignKeyName;

      if (reference.targetKey) {
        const expectedConventionalTargetKeyName = underscored
          ? _.snakeCase(reference.targetKey) : reference.targetKey;
        const targetKeyColumnUnconventional =
          reference.targetKey !== expectedConventionalTargetKeyName;
        return {
          ...reference,
          foreignKeyColumnUnconventional,
          targetKeyColumnUnconventional,
        };
      }
      return { ...reference, foreignKeyColumnUnconventional };
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
    const templatePath = `${__dirname}/../templates/app/routes/route.txt`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    const modelNameDasherized = _.kebabCase(modelName);
    const readableModelName = _.startCase(modelName);
    const text = template({
      modelName,
      modelNameDasherized,
      modelNameReadablePlural: plural(readableModelName),
      modelNameReadableSingular: singular(readableModelName),
      dbDialect: config.dbDialect,
    });

    const filename = tableToFilename(modelName);
    writeFile(`${path}/routes/${filename}.js`, text);
  }

  function writeForestCollection(table) {
    const templatePath = `${__dirname}/../templates/app/forest/collection.txt`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));
    const text = template({ ...config, table });

    const filname = tableToFilename(table);
    writeFile(`${path}/forest/${filname}.js`, text);
  }

  function writeAppJs() {
    const templatePath = `${__dirname}/../templates/app/app.txt`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));
    const text = template({ ...config, forestUrl: process.env.FOREST_URL });

    writeFile(`${path}/app.js`, text);
  }

  function writeModelsIndex() {
    const templatePath = `${__dirname}/../templates/app/models/index.js`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));
    const text = template({ config });

    writeFile(`${path}/models/index.js`, text);
  }

  function writeDockerfile() {
    const templatePath = `${__dirname}/../templates/app/Dockerfile`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    const settings = {
      port: config.appPort || DEFAULT_PORT,
    };

    writeFile(`${path}/Dockerfile`, template(settings));
  }

  function writeDockerCompose() {
    const templatePath = `${__dirname}/../templates/app/docker-compose.yml`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    const settings = {
      appName: config.appName,
      containerName: _.snakeCase(config.appName),
      hostname: config.appHostname || 'http://localhost',
      port: config.appPort || DEFAULT_PORT,
      databaseUrl: getDatabaseUrl().replace('localhost', 'host.docker.internal'),
      ssl: config.ssl,
      dbSchema: config.dbSchema,
      forestEnvSecret: config.forestEnvSecret,
      forestAuthSecret: config.forestAuthSecret,
      forestUrl: process.env.FOREST_URL,
    };

    writeFile(`${path}/docker-compose.yml`, template(settings));
  }

  function writeDotDockerIgnore() {
    const templatePath = `${__dirname}/../templates/app/dockerignore`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    writeFile(`${path}/.dockerignore`, template({}));
  }

  function writeForestAdminMiddleware() {
    mkdirp.sync(`${process.cwd()}/middlewares`);
    const templatePath = `${__dirname}/../templates/app/middlewares/forestadmin.txt`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));
    writeFile(`${path}/middlewares/forestadmin.js`, template(config));
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
    ];

    if (config.db) {
      directories.push(mkdirp(modelsPath));
    }

    await P.all(directories);

    copyTemplate('bin/www', `${binPath}/www`);

    const modelNames = Object.keys(schema)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    modelNames.forEach(writeForestCollection);

    writeForestAdminMiddleware();
    copyTemplate('middlewares/welcome.js', `${path}/middlewares/welcome.js`);

    if (config.db) { writeModelsIndex(path); }
    modelNames.forEach((modelName) => {
      const { fields, references, options } = schema[modelName];
      writeModel(modelName, fields, references, options);
    });

    copyTemplate('public/favicon.png', `${path}/public/favicon.png`);
    modelNames.forEach((modelName) => {
      writeRoute(modelName);
    });
    copyTemplate('views/index.html', `${path}/views/index.html`);

    writeDotDockerIgnore();
    writeDotEnv();
    writeDotGitIgnore();

    writeAppJs();
    writeDockerCompose();
    writeDockerfile();
    writePackageJson();
  };
}

module.exports = Dumper;

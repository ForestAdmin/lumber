const fs = require('fs');
const os = require('os');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const Handlebars = require('handlebars');
const chalk = require('chalk');
const { plural, singular } = require('pluralize');
const Sequelize = require('sequelize');
const stringUtils = require('../utils/strings');
const logger = require('./logger');
const toValidPackageName = require('../utils/to-valid-package-name');
require('../handlerbars/loader');

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

class Dumper {
  constructor(config) {
    this.config = config;

    this.path = `${process.cwd()}/${this.config.appName}`;
    this.routesPath = `${this.path}/routes`;
    this.forestPath = `${this.path}/forest`;
    this.publicPath = `${this.path}/public`;
    this.viewPath = `${this.path}/views`;
    this.modelsPath = `${this.path}/models`;
    this.middlewaresPath = `${this.path}/middlewares`;
  }

  static isLinuxBasedOs() {
    return os.platform() === 'linux';
  }

  writeFile(filePath, content) {
    fs.writeFileSync(filePath, content);
    logger.log(`  ${chalk.green('create')} ${filePath.substring(this.path.length + 1)}`);
  }

  copyTemplate(from, to) {
    const newFrom = `${__dirname}/../templates/app/${from}`;
    this.writeFile(to, fs.readFileSync(newFrom, 'utf-8'));
  }

  copyHandleBarsTemplate({ source, target, context }) {
    function handlebarsTemplate(templatePath) {
      return Handlebars.compile(
        fs.readFileSync(`${__dirname}/../templates/${templatePath}`, 'utf-8'),
        { noEscape: true },
      );
    }

    if (!(source && target && context)) {
      throw new Error('Missing argument (source, target or context).');
    }

    this.writeFile(`${this.path}/${target}`, handlebarsTemplate(source)(context));
  }

  writePackageJson() {
    const orm = this.config.dbDialect === 'mongodb' ? 'mongoose' : 'sequelize';
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

    if (this.config.dbDialect) {
      if (this.config.dbDialect.includes('postgres')) {
        dependencies.pg = '~8.2.2';
      } else if (this.config.dbDialect === 'mysql') {
        dependencies.mysql2 = '~2.2.5';
      } else if (this.config.dbDialect === 'mssql') {
        dependencies.tedious = '^6.4.0';
      } else if (this.config.dbDialect === 'mongodb') {
        delete dependencies.sequelize;
        dependencies.mongoose = '~5.8.2';
      }
    }

    const pkg = {
      name: toValidPackageName(this.config.appName),
      version: '0.0.1',
      private: true,
      scripts: { start: 'node ./server.js' },
      dependencies,
    };

    this.writeFile(`${this.path}/package.json`, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  static tableToFilename(table) {
    return _.kebabCase(table);
  }

  getDatabaseUrl() {
    let connectionString;

    if (this.config.dbConnectionUrl) {
      connectionString = this.config.dbConnectionUrl;
    } else {
      let protocol = this.config.dbDialect;
      let port = `:${this.config.dbPort}`;
      let password = '';

      if (this.config.dbDialect === 'mongodb' && this.config.mongodbSrv) {
        protocol = 'mongodb+srv';
        port = '';
      }

      if (this.config.dbPassword) {
        // NOTICE: Encode password string in case of special chars.
        password = `:${encodeURIComponent(this.config.dbPassword)}`;
      }

      connectionString = `${protocol}://${this.config.dbUser}${password}@${this.config.dbHostname}${port}/${this.config.dbName}`;
    }

    return connectionString;
  }

  isDatabaseLocal() {
    const databaseUrl = this.getDatabaseUrl();
    return databaseUrl.includes('127.0.0.1') || databaseUrl.includes('localhost');
  }

  static isLocalUrl(url) {
    return /^http:\/\/(?:localhost|127\.0\.0\.1)$/.test(url);
  }

  getPort() {
    return this.config.appPort || DEFAULT_PORT;
  }

  getApplicationUrl() {
    const hostUrl = /^https?:\/\//.test(this.config.appHostname)
      ? this.config.appHostname
      : `http://${this.config.appHostname}`;

    return Dumper.isLocalUrl(hostUrl)
      ? `${hostUrl}:${this.getPort()}`
      : hostUrl;
  }

  writeDotEnv() {
    const context = {
      databaseUrl: this.getDatabaseUrl(),
      ssl: this.config.ssl || 'false',
      dbSchema: this.config.dbSchema,
      hostname: this.config.appHostname,
      port: this.getPort(),
      forestEnvSecret: this.config.forestEnvSecret,
      forestAuthSecret: this.config.forestAuthSecret,
      hasDockerDatabaseUrl: false,
      applicationUrl: this.getApplicationUrl(),
    };
    if (!Dumper.isLinuxBasedOs()) {
      context.dockerDatabaseUrl = this.getDatabaseUrl().replace('localhost', 'host.docker.internal');
      context.hasDockerDatabaseUrl = true;
    }
    this.copyHandleBarsTemplate({
      source: 'app/env.hbs',
      target: '.env',
      context,
    });
  }

  static getModelNameFromTableName(table) {
    return stringUtils.camelCase(stringUtils.transformToSafeString(table));
  }

  getSafeDefaultValue(field) {
    // NOTICE: in case of SQL dialect, ensure default value is directly usable in template
    //         as a JS value.
    let safeDefaultValue = field.defaultValue;
    if (this.config.dbDialect !== 'mongodb') {
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

  writeModel(table, fields, references, options = {}) {
    const { underscored } = options;

    const fieldsDefinition = fields.map((field) => {
      const expectedConventionalColumnName = underscored ? _.snakeCase(field.name) : field.name;
      // NOTICE: sequelize considers column name with parenthesis as raw Attributes
      // only set as unconventional name if underscored is true for adding special field attribute
      // and avoid sequelize issues
      const hasParenthesis = field.nameColumn && (field.nameColumn.includes('(') || field.nameColumn.includes(')'));
      const nameColumnUnconventional = field.nameColumn !== expectedConventionalColumnName
        || (underscored && (/[1-9]/g.test(field.name) || hasParenthesis));
      const safeDefaultValue = this.getSafeDefaultValue(field);

      return {
        ...field,
        ref: field.ref && Dumper.getModelNameFromTableName(field.ref),
        nameColumnUnconventional,
        hasParenthesis,
        safeDefaultValue,
        // NOTICE: needed to keep falsy default values in template
        hasSafeDefaultValue: !_.isNil(safeDefaultValue),
      };
    });

    const referencesDefinition = references.map((reference) => ({
      ...reference,
      isBelongsToMany: reference.association === 'belongsToMany',
      targetKey: _.camelCase(reference.targetKey),
    }));

    this.copyHandleBarsTemplate({
      source: `app/models/${this.config.dbDialect === 'mongodb' ? 'mongo' : 'sequelize'}-model.hbs`,
      target: `models/${Dumper.tableToFilename(table)}.js`,
      context: {
        modelName: Dumper.getModelNameFromTableName(table),
        modelVariableName: stringUtils.pascalCase(stringUtils.transformToSafeString(table)),
        table,
        fields: fieldsDefinition,
        references: referencesDefinition,
        ...options,
        schema: this.config.dbSchema,
        dialect: this.config.dbDialect,
        noId: !options.hasIdColumn && !options.hasPrimaryKeys,
      },
    });
  }

  writeRoute(modelName) {
    const modelNameDasherized = _.kebabCase(modelName);
    const readableModelName = _.startCase(modelName);

    this.copyHandleBarsTemplate({
      source: 'app/routes/route.hbs',
      target: `routes/${Dumper.tableToFilename(modelName)}.js`,
      context: {
        modelName: Dumper.getModelNameFromTableName(modelName),
        modelNameDasherized,
        modelNameReadablePlural: plural(readableModelName),
        modelNameReadableSingular: singular(readableModelName),
        isMongoDB: this.config.dbDialect === 'mongodb',
      },
    });
  }

  writeForestCollection(table) {
    this.copyHandleBarsTemplate({
      source: 'app/forest/collection.hbs',
      target: `forest/${Dumper.tableToFilename(table)}.js`,
      context: {
        isMongoDB: this.config.dbDialect === 'mongodb',
        table: Dumper.getModelNameFromTableName(table),
      },
    });
  }

  writeAppJs() {
    this.copyHandleBarsTemplate({
      source: 'app/app.hbs',
      target: 'app.js',
      context: {
        isMongoDB: this.config.dbDialect === 'mongodb',
        forestUrl: process.env.FOREST_URL,
      },
    });
  }

  writeModelsIndex() {
    const { dbDialect } = this.config;

    this.copyHandleBarsTemplate({
      source: 'app/models/index.hbs',
      target: 'models/index.js',
      context: {
        isMongoDB: dbDialect === 'mongodb',
        isMSSQL: dbDialect === 'mssql',
        isMySQL: dbDialect === 'mysql',
      },
    });
  }

  writeDockerfile() {
    this.copyHandleBarsTemplate({
      source: 'app/Dockerfile.hbs',
      target: 'Dockerfile',
      context: {},
    });
  }

  writeDockerCompose() {
    const databaseUrl = `\${${Dumper.isLinuxBasedOs() ? 'DATABASE_URL' : 'DOCKER_DATABASE_URL'}}`;
    const forestUrl = process.env.FOREST_URL ? `\${FOREST_URL-${process.env.FOREST_URL}}` : false;
    this.copyHandleBarsTemplate({
      source: 'app/docker-compose.hbs',
      target: 'docker-compose.yml',
      context: {
        containerName: _.snakeCase(this.config.appName),
        databaseUrl,
        dbSchema: this.config.dbSchema,
        forestUrl,
        network: (Dumper.isLinuxBasedOs() && this.isDatabaseLocal()) ? 'host' : null,
      },
    });
  }

  writeForestAdminMiddleware() {
    this.copyHandleBarsTemplate({
      source: 'app/middlewares/forestadmin.hbs',
      target: 'middlewares/forestadmin.js',
      context: { isMongoDB: this.config.dbDialect === 'mongodb' },
    });
  }

  // NOTICE: Generate files in alphabetical order to ensure a nice generation console logs display.
  async dump(schema) {
    const directories = [
      mkdirp(this.path),
      mkdirp(this.routesPath),
      mkdirp(this.forestPath),
      mkdirp(this.viewPath),
      mkdirp(this.publicPath),
      mkdirp(this.middlewaresPath),
      mkdirp(this.modelsPath),
    ];

    await Promise.all(directories);

    const modelNames = Object.keys(schema)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    modelNames.forEach(this.writeForestCollection.bind(this));

    this.writeForestAdminMiddleware();
    this.copyTemplate('middlewares/welcome.hbs', `${this.path}/middlewares/welcome.js`);

    this.writeModelsIndex();
    modelNames.forEach((modelName) => {
      const { fields, references, options } = schema[modelName];
      const safeReferences = references.map((reference) => ({
        ...reference,
        ref: Dumper.getModelNameFromTableName(reference.ref),
      }));
      this.writeModel(modelName, fields, safeReferences, options);
    });

    this.copyTemplate('public/favicon.png', `${this.path}/public/favicon.png`);

    modelNames.forEach((modelName) => {
      // HACK: If a table name is "sessions" the generated routes will conflict with Forest Admin
      //       internal session creation route. As a workaround, we don't generate the route file.
      // TODO: Remove the if condition, once the routes paths refactored to prevent such conflict.
      if (modelName !== 'sessions') {
        this.writeRoute(modelName);
      }
    });

    this.copyTemplate('views/index.hbs', `${this.path}/views/index.html`);
    this.copyTemplate('dockerignore.hbs', `${this.path}/.dockerignore`);
    this.writeDotEnv();
    this.copyTemplate('gitignore.hbs', `${this.path}/.gitignore`);
    this.writeAppJs();
    this.writeDockerCompose();
    this.writeDockerfile();
    this.writePackageJson();
    this.copyTemplate('server.hbs', `${this.path}/server.js`);
  }
}

module.exports = Dumper;

const _ = require('lodash');
const { plural, singular } = require('pluralize');
const stringUtils = require('../utils/strings');
const toValidPackageName = require('../utils/to-valid-package-name');
require('../handlerbars/loader');

const DEFAULT_PORT = 3310;
class Dumper {
  constructor({
    fs,
    chalk,
    env,
    os,
    Sequelize,
    Handlebars,
    logger,
    mkdirp,
  }) {
    this.fs = fs;
    this.chalk = chalk;
    this.env = env;
    this.os = os;
    this.Sequelize = Sequelize;
    this.Handlebars = Handlebars;
    this.logger = logger;
    this.mkdirp = mkdirp;

    this.DEFAULT_VALUE_TYPES_TO_STRINGIFY = [
      `${Sequelize.DataTypes.ARRAY}`,
      `${Sequelize.DataTypes.CITEXT}`,
      `${Sequelize.DataTypes.DATE}`,
      `${Sequelize.DataTypes.ENUM}`,
      `${Sequelize.DataTypes.JSONB}`,
      `${Sequelize.DataTypes.STRING}`,
      `${Sequelize.DataTypes.TEXT}`,
      `${Sequelize.DataTypes.UUID}`,
    ];
  }

  static getModelsNameSorted(schema) {
    return Object.keys(schema)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  static getSafeReferences(references) {
    return references.map((reference) => ({
      ...reference,
      ref: Dumper.getModelNameFromTableName(reference.ref),
    }));
  }

  isLinuxBasedOs() {
    return this.os.platform() === 'linux';
  }

  writeFile(absoluteProjectPath, relativeFilePath, content) {
    this.fs.writeFileSync(`${absoluteProjectPath}/${relativeFilePath}`, content);
    this.logger.log(`  ${this.chalk.green('create')} ${relativeFilePath}`);
  }

  copyTemplate(absoluteProjectPath, relativeFromPath, relativeToPath) {
    const newFrom = `${__dirname}/../templates/app/${relativeFromPath}`;
    this.writeFile(absoluteProjectPath, relativeToPath, this.fs.readFileSync(newFrom, 'utf-8'));
  }

  copyHandleBarsTemplate({
    projectPath,
    source,
    target,
    context,
  }) {
    const handlebarsTemplate = (templatePath) => this.Handlebars.compile(
      this.fs.readFileSync(`${__dirname}/../templates/${templatePath}`, 'utf-8'),
      { noEscape: true },
    );

    if (!(source && target && context && projectPath)) {
      throw new Error('Missing argument (projectPath, source, target or context).');
    }

    this.writeFile(projectPath, target, handlebarsTemplate(source)(context));
  }

  writePackageJson(projectPath, { dbDialect, appName }) {
    const orm = dbDialect === 'mongodb' ? 'mongoose' : 'sequelize';
    const dependencies = {
      'body-parser': '1.19.0',
      chalk: '~1.1.3',
      'cookie-parser': '1.4.4',
      cors: '2.8.5',
      debug: '~4.0.1',
      dotenv: '~6.1.0',
      express: '~4.17.1',
      'express-jwt': '5.3.1',
      [`forest-express-${orm}`]: '^7.0.0-beta.1',
      morgan: '1.9.1',
      'require-all': '^3.0.0',
      sequelize: '~5.15.1',
    };

    if (dbDialect) {
      if (dbDialect.includes('postgres')) {
        dependencies.pg = '~8.2.2';
      } else if (dbDialect === 'mysql') {
        dependencies.mysql2 = '~2.2.5';
      } else if (dbDialect === 'mssql') {
        dependencies.tedious = '^6.4.0';
      } else if (dbDialect === 'mongodb') {
        delete dependencies.sequelize;
        dependencies.mongoose = '~5.8.2';
      }
    }

    const pkg = {
      name: toValidPackageName(appName),
      version: '0.0.1',
      private: true,
      scripts: { start: 'node ./server.js' },
      dependencies,
    };

    this.writeFile(projectPath, 'package.json', `${JSON.stringify(pkg, null, 2)}\n`);
  }

  static tableToFilename(table) {
    return _.kebabCase(table);
  }

  static getDatabaseUrl(config) {
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

  static isDatabaseLocal(config) {
    const databaseUrl = Dumper.getDatabaseUrl(config);
    return databaseUrl.includes('127.0.0.1') || databaseUrl.includes('localhost');
  }

  static isLocalUrl(url) {
    return /^http:\/\/(?:localhost|127\.0\.0\.1)$/.test(url);
  }

  static getPort(config) {
    return config.appPort || DEFAULT_PORT;
  }

  static getApplicationUrl(config) {
    const hostUrl = /^https?:\/\//.test(config.appHostname)
      ? config.appHostname
      : `http://${config.appHostname}`;

    return Dumper.isLocalUrl(hostUrl)
      ? `${hostUrl}:${Dumper.getPort(config)}`
      : hostUrl;
  }

  writeDotEnv(projectPath, config) {
    const databaseUrl = Dumper.getDatabaseUrl(config);
    const context = {
      databaseUrl,
      ssl: config.ssl || 'false',
      dbSchema: config.dbSchema,
      hostname: config.appHostname,
      port: Dumper.getPort(config),
      forestEnvSecret: config.forestEnvSecret,
      forestAuthSecret: config.forestAuthSecret,
      hasDockerDatabaseUrl: false,
      applicationUrl: Dumper.getApplicationUrl(config),
    };
    if (!this.isLinuxBasedOs()) {
      context.dockerDatabaseUrl = databaseUrl.replace('localhost', 'host.docker.internal');
      context.hasDockerDatabaseUrl = true;
    }
    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/env.hbs',
      target: '.env',
      context,
    });
  }

  static getModelNameFromTableName(table) {
    return stringUtils.transformToCamelCaseSafeString(table);
  }

  getSafeDefaultValue(dbDialect, field) {
    // NOTICE: in case of SQL dialect, ensure default value is directly usable in template
    //         as a JS value.
    let safeDefaultValue = field.defaultValue;
    if (dbDialect !== 'mongodb') {
      if (typeof safeDefaultValue === 'object' && safeDefaultValue instanceof this.Sequelize.Utils.Literal) {
        safeDefaultValue = `Sequelize.literal('${safeDefaultValue.val}')`;
      } else if (!_.isNil(safeDefaultValue)) {
        if (_.some(
          this.DEFAULT_VALUE_TYPES_TO_STRINGIFY,
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

  writeModel(projectPath, config, table, fields, references, options = {}) {
    const { underscored, dbName } = options;

    const fieldsDefinition = fields.map((field) => {
      const expectedConventionalColumnName = underscored ? _.snakeCase(field.name) : field.name;
      // NOTICE: sequelize considers column name with parenthesis as raw Attributes
      // only set as unconventional name if underscored is true for adding special field attribute
      // and avoid sequelize issues
      const hasParenthesis = field.nameColumn && (field.nameColumn.includes('(') || field.nameColumn.includes(')'));
      const nameColumnUnconventional = field.nameColumn !== expectedConventionalColumnName
        || (underscored && (/[1-9]/g.test(field.name) || hasParenthesis));
      const safeDefaultValue = this.getSafeDefaultValue(config.dbDialect, field);

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
      projectPath,
      source: `app/models/${config.dbDialect === 'mongodb' ? 'mongo' : 'sequelize'}-model.hbs`,
      target: `models${dbName ? `/${dbName}` : ''}/${Dumper.tableToFilename(table)}.js`,
      context: {
        modelName: Dumper.getModelNameFromTableName(table),
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

  writeRoute(projectPath, config, modelName) {
    const modelNameDasherized = _.kebabCase(modelName);
    const readableModelName = _.startCase(modelName);

    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/routes/route.hbs',
      target: `routes/${Dumper.tableToFilename(modelName)}.js`,
      context: {
        modelName: Dumper.getModelNameFromTableName(modelName),
        modelNameDasherized,
        modelNameReadablePlural: plural(readableModelName),
        modelNameReadableSingular: singular(readableModelName),
        isMongoDB: config.dbDialect === 'mongodb',
      },
    });
  }

  writeForestCollection(projectPath, config, table) {
    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/forest/collection.hbs',
      target: `forest/${Dumper.tableToFilename(table)}.js`,
      context: {
        isMongoDB: config.dbDialect === 'mongodb',
        table: Dumper.getModelNameFromTableName(table),
      },
    });
  }

  writeAppJs(projectPath, config) {
    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/app.hbs',
      target: 'app.js',
      context: {
        isMongoDB: config.dbDialect === 'mongodb',
        forestUrl: this.env.FOREST_URL,
      },
    });
  }

  writeModelsIndex(projectPath, config) {
    const { dbDialect } = config;

    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/models/index.hbs',
      target: 'models/index.js',
      context: {
        isMongoDB: dbDialect === 'mongodb',
      },
    });
  }

  writeDatabasesConfig(projectPath, config) {
    const { dbDialect } = config;

    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/config/databases.hbs',
      target: 'config/databases.js',
      context: {
        isMongoDB: dbDialect === 'mongodb',
        isMSSQL: dbDialect === 'mssql',
        isMySQL: dbDialect === 'mysql',
      },
    });
  }

  writeDockerfile(projectPath) {
    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/Dockerfile.hbs',
      target: 'Dockerfile',
      context: {},
    });
  }

  writeDockerCompose(projectPath, config) {
    const databaseUrl = `\${${this.isLinuxBasedOs() ? 'DATABASE_URL' : 'DOCKER_DATABASE_URL'}}`;
    const forestUrl = this.env.FOREST_URL ? `\${FOREST_URL-${this.env.FOREST_URL}}` : false;
    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/docker-compose.hbs',
      target: 'docker-compose.yml',
      context: {
        containerName: _.snakeCase(config.appName),
        databaseUrl,
        dbSchema: config.dbSchema,
        forestUrl,
        network: (this.isLinuxBasedOs() && Dumper.isDatabaseLocal(config)) ? 'host' : null,
      },
    });
  }

  writeForestAdminMiddleware(projectPath, config) {
    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/middlewares/forestadmin.hbs',
      target: 'middlewares/forestadmin.js',
      context: { isMongoDB: config.dbDialect === 'mongodb' },
    });
  }

  // NOTICE: Generate files in alphabetical order to ensure a nice generation console logs display.
  async dump(schema, config) {
    const projectPath = `${process.cwd()}/${config.appName}`;

    const directories = [
      this.mkdirp(projectPath),
      this.mkdirp(`${projectPath}/routes`),
      this.mkdirp(`${projectPath}/config`),
      this.mkdirp(`${projectPath}/forest`),
      this.mkdirp(`${projectPath}/public`),
      this.mkdirp(`${projectPath}/views`),
      this.mkdirp(`${projectPath}/models`),
      this.mkdirp(`${projectPath}/middlewares`),
    ];

    await Promise.all(directories);

    const modelNames = Dumper.getModelsNameSorted(schema);

    this.writeDatabasesConfig(projectPath, config);

    modelNames.forEach((modelName) => this.writeForestCollection(projectPath, config, modelName));

    this.writeForestAdminMiddleware(projectPath, config);
    this.copyTemplate(projectPath, 'middlewares/welcome.hbs', 'middlewares/welcome.js');

    this.writeModelsIndex(projectPath, config);
    modelNames.forEach((modelName) => {
      const { fields, references, options } = schema[modelName];
      const safeReferences = Dumper.getSafeReferences(references);
      this.writeModel(projectPath, config, modelName, fields, safeReferences, options);
    });

    this.copyTemplate(projectPath, 'public/favicon.png', 'public/favicon.png');

    modelNames.forEach((modelName) => {
      // HACK: If a table name is "sessions" the generated routes will conflict with Forest Admin
      //       internal session creation route. As a workaround, we don't generate the route file.
      // TODO: Remove the if condition, once the routes paths refactored to prevent such conflict.
      if (modelName !== 'sessions') {
        this.writeRoute(projectPath, config, modelName);
      }
    });

    this.copyTemplate(projectPath, 'views/index.hbs', 'views/index.html');
    this.copyTemplate(projectPath, 'dockerignore.hbs', '.dockerignore');
    this.writeDotEnv(projectPath, config);
    this.copyTemplate(projectPath, 'gitignore.hbs', '.gitignore');
    this.writeAppJs(projectPath, config);
    this.writeDockerCompose(projectPath, config);
    this.writeDockerfile(projectPath);
    this.writePackageJson(projectPath, config);
    this.copyTemplate(projectPath, 'server.hbs', 'server.js');
  }

  checkIsLumberProject() {
    try {
      if (!this.fs.existsSync(this.routesPath)) throw new Error('No "routes" directory.');
      if (!this.fs.existsSync(this.forestPath)) throw new Error('No "forest" directory.');
      if (!this.fs.existsSync(this.modelsPath)) throw new Error('No "models“ directory.');
    } catch (error) {
      throw new Error(`We are not able to detect a lumber project file architecture at this path: ${this.path}. ${error}`);
    }
  }

  writeForestCollectionIfNotExist(table) {
    const collectionPath = `forest/${Dumper.tableToFilename(table)}.js`;
    if (this.fs.existsSync(collectionPath)) {
      this.logger.log(`  ${this.chalk.yellow('skip')}   ${collectionPath} - already exist.`);
      return;
    }

    this.writeForestCollection(table);
  }

  writeModelIfNotExist(dbName, table, fields, references, options = {}) {
    const modelPath = `models/${dbName}/${Dumper.tableToFilename(table)}.js`;
    if (this.fs.existsSync(modelPath)) {
      this.logger.log(`  ${this.chalk.yellow('skip')}   ${modelPath} - already exist.`);
      return;
    }

    this.writeModel(table, fields, references, options);
  }

  writeRoutelIfNotExist(table) {
    const routesPath = `routes/${Dumper.tableToFilename(table)}.js`;
    if (this.fs.existsSync(routesPath)) {
      this.logger.log(`  ${this.chalk.yellow('skip')}   ${routesPath} - already exist.`);
      return;
    }

    this.writeRoute(table);
  }

  async redump(schemas) {
    this.checkIsLumberProject();

    Object.entries(schemas).forEach(([dbName, schema]) => {
      const modelNames = Dumper.getModelsNameSorted(schema);

      modelNames.forEach((modelName) => {
        const { fields, references, options } = schema[modelName];
        const safeReferences = Dumper.getSafeReferences(references);

        options.dbName = dbName;

        this.writeForestCollectionIfNotExist(modelName);
        this.writeModelIfNotExist(dbName, modelName, fields, safeReferences, options);
        // HACK: If a table name is "sessions" the generated routes will conflict with Forest Admin
        //       internal session creation route. As a workaround, we don't generate the route file.
        // TODO: Remove the if condition, once the routes paths refactored to prevent such conflict.
        if (modelName !== 'sessions') {
          this.writeRoutelIfNotExist(modelName);
        }
      });
    });
  }
}

module.exports = Dumper;

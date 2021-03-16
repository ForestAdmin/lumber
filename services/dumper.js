const _ = require('lodash');
const { plural, singular } = require('pluralize');
const stringUtils = require('../utils/strings');
const toValidPackageName = require('../utils/to-valid-package-name');
const IncompatibleLianaForUpdateError = require('../utils/errors/dumper/incompatible-liana-for-update-error');
const InvalidLumberProjectStructureError = require('../utils/errors/dumper/invalid-lumber-project-structure-error');
require('../handlerbars/loader');

const DEFAULT_PORT = 3310;
class Dumper {
  constructor({
    fs,
    chalk,
    constants,
    env,
    os,
    Sequelize,
    Handlebars,
    logger,
    mkdirp,
  }) {
    this.fs = fs;
    this.chalk = chalk;
    this.constants = constants;
    this.env = env;
    this.os = os;
    this.Sequelize = Sequelize;
    this.Handlebars = Handlebars;
    this.logger = logger;
    this.mkdirp = mkdirp;
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
    const fileName = `${absoluteProjectPath}/${relativeFilePath}`;

    if (this.fs.existsSync(fileName)) {
      this.logger.log(`  ${this.chalk.yellow('skip')} ${relativeFilePath} - already exist.`);
      return;
    }

    this.fs.writeFileSync(fileName, content);
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
      [`forest-express-${orm}`]: '^7.0.0',
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

  writeModel(projectPath, config, table, fields, references, options = {}) {
    const { underscored } = options;
    let modelPath = `models/${Dumper.tableToFilename(table)}.js`;
    if (config.useMultiDatabase) {
      modelPath = `models/${config.modelsExportPath}/${Dumper.tableToFilename(table)}.js`;
    }

    const fieldsDefinition = fields.map((field) => {
      const expectedConventionalColumnName = underscored ? _.snakeCase(field.name) : field.name;
      // NOTICE: sequelize considers column name with parenthesis as raw Attributes
      // only set as unconventional name if underscored is true for adding special field attribute
      // and avoid sequelize issues
      const hasParenthesis = field.nameColumn && (field.nameColumn.includes('(') || field.nameColumn.includes(')'));
      const nameColumnUnconventional = field.nameColumn !== expectedConventionalColumnName
        || (underscored && (/[1-9]/g.test(field.name) || hasParenthesis));

      return {
        ...field,
        ref: field.ref && Dumper.getModelNameFromTableName(field.ref),
        nameColumnUnconventional,
        hasParenthesis,

        // Only output default value when non-null
        hasSafeDefaultValue: !_.isNil(field.defaultValue),
        safeDefaultValue: field.defaultValue instanceof this.Sequelize.Utils.Literal
          ? `Sequelize.literal('${field.defaultValue.val.replace(/'/g, '\\\'')}')`
          : JSON.stringify(field.defaultValue),
      };
    });

    const referencesDefinition = references.map((reference) => ({
      ...reference,
      isBelongsToMany: reference.association === 'belongsToMany',
      targetKey: _.camelCase(reference.targetKey),
      sourceKey: _.camelCase(reference.sourceKey),
    }));

    this.copyHandleBarsTemplate({
      projectPath,
      source: `app/models/${config.dbDialect === 'mongodb' ? 'mongo' : 'sequelize'}-model.hbs`,
      target: modelPath,
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
    const routesPath = `routes/${Dumper.tableToFilename(modelName)}.js`;

    const modelNameDasherized = _.kebabCase(modelName);
    const readableModelName = _.startCase(modelName);

    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/routes/route.hbs',
      target: routesPath,
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
    const collectionPath = `forest/${Dumper.tableToFilename(table)}.js`;

    this.copyHandleBarsTemplate({
      projectPath,
      source: 'app/forest/collection.hbs',
      target: collectionPath,
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
    const forestUrl = this.env.FOREST_URL !== this.constants.DEFAULT_FOREST_URL ? `\${FOREST_URL-${this.env.FOREST_URL}}` : false;
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
    const cwd = process.cwd();
    const projectPath = config.appName ? `${cwd}/${config.appName}` : cwd;
    const { isUpdate, useMultiDatabase, modelsExportPath } = config;

    await this.mkdirp(projectPath);
    await this.mkdirp(`${projectPath}/routes`);
    await this.mkdirp(`${projectPath}/forest`);
    await this.mkdirp(`${projectPath}/models`);

    if (useMultiDatabase) {
      await this.mkdirp(`${projectPath}/models/${modelsExportPath}`);
    }

    if (!isUpdate) {
      await this.mkdirp(`${projectPath}/config`);
      await this.mkdirp(`${projectPath}/public`);
      await this.mkdirp(`${projectPath}/views`);
      await this.mkdirp(`${projectPath}/middlewares`);
    }

    const modelNames = Dumper.getModelsNameSorted(schema);

    if (!isUpdate) this.writeDatabasesConfig(projectPath, config);

    modelNames.forEach((modelName) => this.writeForestCollection(projectPath, config, modelName));

    if (!isUpdate) {
      this.writeForestAdminMiddleware(projectPath, config);
      this.copyTemplate(projectPath, 'middlewares/welcome.hbs', 'middlewares/welcome.js');
      this.writeModelsIndex(projectPath, config);
    }

    modelNames.forEach((modelName) => {
      const { fields, references, options } = schema[modelName];
      const safeReferences = Dumper.getSafeReferences(references);

      this.writeModel(projectPath, config, modelName, fields, safeReferences, options);
    });

    if (!isUpdate) this.copyTemplate(projectPath, 'public/favicon.png', 'public/favicon.png');

    modelNames.forEach((modelName) => {
      // HACK: If a table name is "sessions" the generated routes will conflict with Forest Admin
      //       internal session creation route. As a workaround, we don't generate the route file.
      // TODO: Remove the if condition, once the routes paths refactored to prevent such conflict.
      if (modelName !== 'sessions') {
        this.writeRoute(projectPath, config, modelName);
      }
    });

    if (!isUpdate) {
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
  }

  checkLumberProjectStructure() {
    const currentPath = process.cwd();
    try {
      if (!this.fs.existsSync(`${currentPath}/routes`)) throw new Error('No "routes" directory.');
      if (!this.fs.existsSync(`${currentPath}/forest`)) throw new Error('No "forest" directory.');
      if (!this.fs.existsSync(`${currentPath}/models`)) throw new Error('No "models“ directory.');
    } catch (error) {
      throw new InvalidLumberProjectStructureError(currentPath, error);
    }
  }

  checkLianaCompatiblityForUpdate() {
    const packagePath = `${process.cwd()}/package.json`;
    if (!this.fs.existsSync(packagePath)) throw new IncompatibleLianaForUpdateError(`"${packagePath}" not found.`);

    const file = this.fs.readFileSync(packagePath, 'utf8');
    const match = /forest-express-.*((\d).\d.\d)/g.exec(file);

    let lianaMajorVersion = 0;
    if (match) {
      [, , lianaMajorVersion] = match;
    }
    if (Number(lianaMajorVersion) < 7) {
      throw new IncompatibleLianaForUpdateError(
        'Your project is not compatible with the `lumber update` command. You need to use an agent version greater than 7.0.0.',
      );
    }
  }

  hasMultipleDatabaseStructure() {
    const files = this.fs.readdirSync(`${process.cwd()}/models`, { withFileTypes: true });
    return !files.some((file) => file.isFile() && file.name !== 'index.js');
  }
}

module.exports = Dumper;

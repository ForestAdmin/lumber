const P = require('bluebird');
const fs = require('fs');
const _ = require('lodash');
const mkdirpSync = require('mkdirp');
const KeyGenerator = require('./key-generator');

const mkdirp = P.promisify(mkdirpSync);

const DEFAULT_PORT = 3000;

function Dumper(config) {
  const path = `${process.cwd()}/${config.appName}`;
  const binPath = `${path}/bin`;
  const routesPath = `${path}/routes`;
  const publicPath = `${path}/public`;
  const modelsPath = `${path}/models`;
  const middlewaresPath = `${path}/middlewares`;

  function copyTemplate(from, to) {
    const newFrom = `${__dirname}/../templates/app/${from}`;
    fs.writeFileSync(to, fs.readFileSync(newFrom, 'utf-8'));
  }

  function writePackageJson(pathDest) {
    const dependencies = {
      express: '~4.16.3',
      debug: '~4.0.1',
      dotenv: '~6.1.0',
      chalk: '~1.1.3',
      sequelize: '~5.15.1',
      'require-all': '^3.0.0',
    };

    if (config.dbDialect) {
      if (config.dbDialect.includes('postgres')) {
        dependencies.pg = '~6.1.0';
      } else if (config.dbDialect === 'mysql') {
        dependencies.mysql2 = '~1.4.2';
      } else if (config.dbDialect === 'mssql') {
        dependencies.tedious = '^1.14.0';
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

    fs.writeFileSync(`${pathDest}/package.json`, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  function writeDotGitIgnore(pathDest) {
    const templatePath = `${__dirname}/../templates/app/gitignore`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    fs.writeFileSync(`${pathDest}/.gitignore`, template({}));
  }

  function writeDotGitKeep(pathDest) {
    const templatePath = `${__dirname}/../templates/app/gitkeep`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    fs.writeFileSync(`${pathDest}/.gitkeep`, template({}));
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

  function writeDotEnv(pathDest, authSecret) {
    const templatePath = `${__dirname}/../templates/app/env`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    const settings = {
      databaseUrl: getDatabaseUrl(),
      ssl: config.ssl,
      encrypt: config.ssl && config.dbDialect === 'mssql',
      dbSchema: config.dbSchema,
      hostname: config.appHostname,
      port: config.appPort,
      authSecret,
    };

    fs.writeFileSync(`${pathDest}/.env`, template(settings));
  }

  function writeModel(pathDest, table, fields, references, options = {}) {
    const templatePath = `${__dirname}/../templates/model.txt`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));
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
        reference.foreignKey !== expectedConventionalForeignKeyName;

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
      table,
      fields: fieldsDefinition,
      references: referencesDefinition,
      ...options,
      schema: config.dbSchema,
      dialect: config.dbDialect,
    });

    fs.writeFileSync(`${pathDest}/models/${table}.js`, text);
  }

  function writeAppJs(pathDest) {
    const templatePath = `${__dirname}/../templates/app/app.js`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));
    const text = template({ config });

    fs.writeFileSync(`${pathDest}/app.js`, text);
  }

  function writeModelsIndex(pathDest) {
    const templatePath = `${__dirname}/../templates/app/models/index.js`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));
    const text = template({ config });

    fs.writeFileSync(`${pathDest}/models/index.js`, text);
  }

  function writeDockerfile(pathDest) {
    const templatePath = `${__dirname}/../templates/app/Dockerfile`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    const settings = {
      port: config.appPort || DEFAULT_PORT,
    };

    fs.writeFileSync(`${pathDest}/Dockerfile`, template(settings));
  }

  function writeDockerCompose(pathDest, authSecret) {
    const templatePath = `${__dirname}/../templates/app/docker-compose.yml`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    const settings = {
      appName: config.appName,
      hostname: config.appHostname || 'http://localhost',
      port: config.appPort || DEFAULT_PORT,
      databaseUrl: getDatabaseUrl().replace('localhost', 'host.docker.internal'),
      ssl: config.ssl,
      encrypt: config.ssl && config.dbDialect === 'mssql',
      dbSchema: config.dbSchema,
      authSecret,
    };

    fs.writeFileSync(`${pathDest}/docker-compose.yml`, template(settings));
  }

  function writeDotDockerIgnore(pathDest) {
    const templatePath = `${__dirname}/../templates/app/dockerignore`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    fs.writeFileSync(`${pathDest}/.dockerignore`, template({}));
  }

  async function writeWelcomeMiddlewareIndex() {
    await mkdirp(`${middlewaresPath}/welcome`);
    copyTemplate('middlewares/welcome/index.js', `${middlewaresPath}/welcome/index.js`);
  }

  function writeWelcomeMiddlewareTemplate() {
    copyTemplate('middlewares/welcome/template.txt', `${middlewaresPath}/welcome/template.txt`);
  }

  this.dump = (table, { fields, references, options }) => {
    writeModel(path, table, fields, references, options);
  };

  const dirs = [
    mkdirp(path),
    mkdirp(binPath),
    mkdirp(routesPath),
    mkdirp(publicPath),
    mkdirp(middlewaresPath),
  ];

  if (config.db) {
    dirs.push(mkdirp(modelsPath));
  }

  return (async () => {
    await P.all(dirs);
    const authSecret = await new KeyGenerator().generate();
    copyTemplate('bin/www', `${binPath}/www`);
    copyTemplate('public/favicon.png', `${path}/public/favicon.png`);

    if (config.db) { writeModelsIndex(path); }
    writeAppJs(path);
    writePackageJson(path);
    writeDotGitIgnore(path);
    writeDotGitKeep(routesPath);
    writeDotEnv(path, authSecret);
    writeDockerfile(path);
    writeDockerCompose(path, authSecret);
    writeDotDockerIgnore(path);
    await writeWelcomeMiddlewareIndex();
    writeWelcomeMiddlewareTemplate();

    return this;
  })();
}

module.exports = Dumper;

const P = require('bluebird');
const fs = require('fs');
const _ = require('lodash');
const mkdirpSync = require('mkdirp');
const KeyGenerator = require('./key-generator');

const mkdirp = P.promisify(mkdirpSync);

function Dumper(config) {
  const path = `${process.cwd()}/${config.appName}`;
  const binPath = `${path}/bin`;
  const routesPath = `${path}/routes`;
  const publicPath = `${path}/public`;
  const modelsPath = `${path}/models`;
  const middlewaresPath = `${path}/middlewares`;

  function isUnderscored(fields) {
    let underscored = false;

    fields.forEach((f) => {
      if (f.name.includes('_')) { underscored = true; }
    });

    return underscored;
  }

  function hasTimestamps(fields) {
    let hasCreatedAt = false;
    let hasUpdatedAt = false;

    fields.forEach((f) => {
      if (_.camelCase(f.name) === 'createdAt') {
        hasCreatedAt = true;
      }

      if (_.camelCase(f.name) === 'updatedAt') {
        hasUpdatedAt = true;
      }
    });

    return hasCreatedAt && hasUpdatedAt;
  }

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
      sequelize: '4.8.0',
      'require-all': '^3.0.0',
    };

    if (config.dbDialect === 'postgres') {
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

    const pkg = {
      name: config.appName,
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
      connectionString = `${config.dbDialect}://${config.dbUser}`;
      if (config.dbPassword) {
        // NOTICE: Encode password string in case of special chars.
        connectionString += `:${encodeURIComponent(config.dbPassword)}`;
      }

      connectionString += `@${config.dbHostname}:${config.dbPort}/${config.dbName}`;
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
      port: config.appPort,
      authSecret,
    };

    fs.writeFileSync(`${pathDest}/.env`, template(settings));
  }

  function writeModels(pathDest, table, fields, references) {
    const templatePath = `${__dirname}/../templates/model.txt`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    const text = template({
      table,
      fields,
      references,
      underscored: isUnderscored(fields),
      timestamps: hasTimestamps(fields),
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
      port: config.appPort,
    };

    fs.writeFileSync(`${pathDest}/Dockerfile`, template(settings));
  }

  function writeDockerCompose(pathDest, authSecret) {
    const templatePath = `${__dirname}/../templates/app/docker-compose.yml`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    const settings = {
      appName: config.appName,
      databaseUrl: getDatabaseUrl().replace('localhost', 'host.docker.internal'),
      ssl: config.ssl,
      encrypt: config.ssl && config.dbDialect === 'mssql',
      dbSchema: config.dbSchema,
      port: config.appPort,
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

  this.dump = (table, { fields, references }) => {
    writeModels(path, table, fields, references);
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

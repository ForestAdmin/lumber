'use strict';
const P = require('bluebird');
const fs = require('fs');
const _ = require('lodash');
const mkdirpSync = require('mkdirp');
const mkdirp = P.promisify(mkdirpSync);
const KeyGenerator = require('./key-generator');

function Dumper(project, config) {
  let path = `${process.cwd()}/${config.appName}`;
  let binPath = `${path}/bin`;
  let routesPath = `${path}/routes`;
  let forestPath = `${path}/forest`;
  let publicPath = `${path}/public`;
  let modelsPath = `${path}/models`;

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
    from = `${__dirname}/../templates/app/` + from;
    fs.writeFileSync(to, fs.readFileSync(from, 'utf-8'));
  }

  function writePackageJson(path) {
    let dependencies = {
      'express': '~4.16.3',
      'express-jwt': '~5.3.1',
      'express-cors': 'git://github.com/ForestAdmin/express-cors',
      'body-parser': '~1.18.3',
      'cookie-parser': '~1.4.3',
      'debug': '~4.0.1',
      'morgan': '~1.9.1',
      'serve-favicon': '~2.5.0',
      'dotenv': '~2.0.0',
      'chalk': '~1.1.3',
      'sequelize': '4.8.0',
      'forest-express-sequelize': 'latest',
      'opn': '5.4.0'
    };

    if (config.dbDialect === 'postgres') {
      dependencies.pg = '~6.1.0';
    } else if (config.dbDialect === 'mysql') {
      dependencies.mysql2 = '~1.4.2';
    } else if (config.dbDialect === 'mssql') {
      dependencies.tedious = '^1.14.0';
    } else if (config.dbDialect === 'sqlite') {
      dependencies.sqlite3 = '~3.1.13';
    }

    let pkg = {
      name: config.appName,
      version: '0.0.1',
      private: true,
      scripts: { start: 'node ./bin/www' },
      dependencies: dependencies
    };

    fs.writeFileSync(`${path}/package.json`,
      `${JSON.stringify(pkg, null, 2)}\n`);
  }

  function writeDotGitIgnore(path) {
    let templatePath = `${__dirname}/../templates/app/gitignore`;
    let template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    fs.writeFileSync(`${path}/.gitignore`, template({}));
  }

  function writeDotGitKeep(routesPath) {
    let templatePath = `${__dirname}/../templates/app/gitkeep`;
    let template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    fs.writeFileSync(`${routesPath}/.gitkeep`, template({}));
  }

  function getDatabaseUrl() {
    let connectionString;

    if (config.dbDialect === 'sqlite') {
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

  function writeDotEnv(path, authSecret) {
    let templatePath = `${__dirname}/../templates/app/env`;
    let template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    let settings = {
      forestEnvSecret: project.defaultEnvironment.secretKey,
      forestAuthSecret: authSecret,
      databaseUrl: getDatabaseUrl(),
      forestUrl: process.env.FOREST_URL,
      devRenderingId: project.defaultEnvironment.renderings[0].id,
      ssl: config.ssl,
      encrypt: config.ssl && config.dbDialect === 'mssql',
      dbSchema: config.dbSchema,
      port: config.appPort
    };

    fs.writeFileSync(`${path}/.env`, template(settings));
  }

  function writeModels(path, table, fields, references) {
    let templatePath = `${__dirname}/../templates/model.txt`;
    let template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    let text = template({
      table: table,
      fields: fields,
      references: references,
      underscored: isUnderscored(fields),
      timestamps: hasTimestamps(fields),
      schema: config.dbSchema
    });

    fs.writeFileSync(`${path}/models/${table}.js`, text);
  }

  function writeAppJs(path) {
    let templatePath = `${__dirname}/../templates/app/app.js`;
    let template = _.template(fs.readFileSync(templatePath, 'utf-8'));
    let text = template({ config: config });

    fs.writeFileSync(`${path}/app.js`, text);
  }

  function writeModelsIndex(path) {
    let templatePath = `${__dirname}/../templates/app/models/index.js`;
    let template = _.template(fs.readFileSync(templatePath, 'utf-8'));
    let text = template({ config: config });

    fs.writeFileSync(`${path}/models/index.js`, text);
  }

  this.dump = function (table, fields, references) {
    return writeModels(path, table, fields, references);
  };

  var dirs = [
    mkdirp(path),
    mkdirp(binPath),
    mkdirp(routesPath),
    mkdirp(forestPath),
    mkdirp(publicPath)
  ];

  if (config.dbDialect) { dirs.push(mkdirp(modelsPath)); }
  return P
    .all(dirs)
    .then(() => new KeyGenerator().generate())
    .then((authSecret) => {
      copyTemplate('bin/www', `${binPath}/www`);
      copyTemplate('public/favicon.png', `${path}/public/favicon.png`);

      if (config.dbDialect) {
        writeModelsIndex(path);
      }

      writeAppJs(path);
      writePackageJson(path);
      writeDotGitIgnore(path);
      writeDotGitKeep(routesPath);
      writeDotEnv(path, authSecret);
    })
    .then(() => {
      return this;
    });
}

module.exports = Dumper;

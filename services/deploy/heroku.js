'use strict';
const P = require('bluebird');
const exec = require('child_process').exec;
const agent = require('superagent-promise')(require('superagent'), P);

function Heroku(config) {
  function getDatabaseUrl(config) {
    if (config.dbConnectionUrl) { return config.dbConnectionUrl; }

    let connectionUrl = `${config.dbDialect}://${config.dbUser}`;
    if (config.dbPassword) {
      connectionUrl += `:${config.dbPassword}`;
    }

    connectionUrl += `@${config.dbHostname}:${config.dbPort}/${config.dbName}`;
    return connectionUrl;
  }

  function pollApp(response) {
    return agent
      .get(`https://api.heroku.com/app-setups/${response.id}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/vnd.heroku+json; version=3')
      .set('Authorization', `Bearer ${config.herokuAuthToken}`)
      .send()
      .then(pollResponse => {
        if (pollResponse.body.status === 'pending') {
          return new P((resolve) => {
            setTimeout(() => {
              return pollApp(response).then(resolve);
            }, 5000);
          });
        } else {
          return pollResponse.body;
        }
      });
  }

  this.login = () => {
    return new P((resolve, reject) => {
      exec('heroku auth:token', (err, stdout) => {
        if (err) { return reject(err); }
        config.herokuAuthToken = stdout.trim();
        resolve(config.herokuAuthToken);
      });
    });
  };

  this.deployApp = (githubRepoLink) => {
    let env = { DATABASE_URL: getDatabaseUrl(config) };
    if (config.dbSSL) { env.SSL_DATABASE = 'true'; }

    return agent
      .post('https://api.heroku.com/app-setups')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/vnd.heroku+json; version=3')
      .set('Authorization', `Bearer ${config.herokuAuthToken}`)
      .send({
        'source_blob': { url: githubRepoLink },
        overrides: {
          env: env
        }
      })
      .then((response) => {
        return pollApp(response.body);
      });
  };

  this.updateForestEnvSecret = (appName, envSecret) => {
    return agent
      .patch(`https://api.heroku.com/apps/${appName}/config-vars`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/vnd.heroku+json; version=3')
      .set('Authorization', `Bearer ${config.herokuAuthToken}`)
      .send({ FOREST_ENV_SECRET: envSecret });
  };
}

module.exports = Heroku;

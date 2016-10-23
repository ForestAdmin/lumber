'use strict';
var P = require('bluebird');
var _ = require('lodash');
var program = require('commander');
var prompt = require('prompt');
var promptGet = P.promisify(prompt.get);

function OptionParser() {
  this.parse = function () {
    var config = {};
    var prompts = [];

    program
      .version('0.0.1')
      .option('-d, --database [database]', 'database')
      .option('-e, --dialect [dialect]', 'dialect')
      .option('-u, --user [user]', 'user')
      .option('-w, --password [password]', 'password')
      .option('-h, --hostname [hostname]', 'hostname')
      .option('-p, --port [port]', 'port')
      .parse(process.argv);


    if (program.database) {
      config.database = program.database;
    } else {
      prompts.push('database');
    }

    if (program.dialect) {
      config.dialect = program.dialect;
    } else {
      prompts.push('dialect');
    }

    if (program.user) {
      config.user = program.user;
    } else {
      prompts.push('username');
    }

    if (program.password) {
      config.password = program.password;
    } else {
      prompts.push('password');
    }

    if (program.hostname) {
      config.hostname = program.hostname;
    } else {
      prompts.push('hostname');
    }

    if (program.port) {
      config.port = program.port;
    } else {
      prompts.push('port');
    }

    prompt.start();

    if (prompts.length) {
      return promptGet(prompts)
        .then(function (promptConfig) {
          return _.merge(config, promptConfig);
        });
    } else {
      return new P((resolve) => resolve(config));
    }
  };
}

module.exports = new OptionParser();

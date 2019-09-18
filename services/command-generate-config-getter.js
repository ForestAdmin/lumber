const Prompter = require('./prompter');

const OPTIONS_DATABASE_MANDATORY = [
  'dbDialect',
  'dbName',
  'dbHostname',
  'dbPort',
  'dbUser',
  'dbPassword',
];
const OPTIONS_DATABASE_OPTIONAL = [
  'ssl',
  'mongodbSrv',
];
const OPTIONS_APPLICATION = [
  'appName',
  'appHostname',
  'appPort',
];

function CommandGenerateConfigGetter(program) {
  this.options = {
    forConnectionUrl: [
      'dbConnectionUrl',
      ...OPTIONS_DATABASE_OPTIONAL,
      ...OPTIONS_APPLICATION,
    ],
    forNoDatabase: OPTIONS_APPLICATION,
    forFullPrompt: [
      ...OPTIONS_DATABASE_MANDATORY,
      ...OPTIONS_DATABASE_OPTIONAL,
      ...OPTIONS_APPLICATION,
    ],
  };

  this.getOptions = () => {
    if (program.connectionUrl) {
      return this.options.forConnectionUrl;
    } else if (!program.db) {
      return this.options.forNoDatabase;
    }
    return this.options.forFullPrompt;
  };

  this.perform = async () => Prompter(program, this.getOptions());
}

module.exports = CommandGenerateConfigGetter;

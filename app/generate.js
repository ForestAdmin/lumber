const fs = require('fs');
const authenticator = require('../services/authenticator');
const DB = require('../services/db');
const Dumper = require('../services/dumper');
const TableAnalyzer = require('../services/table-analyzer');

async function generate(config) {
  if (!authenticator.getAuthToken()) {
    throw new Error('💀  Oops, you need to be logged in to execute this command. 💀 Try the "lumber login" command.');
  }

  // NOTICE: Ensure the project directory doesn't exist yet.
  if (doesDirectoryExist(config.appDir)) {
    throw new Error(`💀  Oops, the directory ${config.appDir} already exists.💀`);
  }

  if (config.db) {
    const db = await new DB().connect(config);
    const schema = await new TableAnalyzer(db, config).perform();
    const project = await authenticator.createProject(config);
    const dumper = new Dumper(project, config);

    await dumper.dumpProject();
    await dumper.dumpSchema(schema);
  }
}

function doesDirectoryExist(path) {
  try {
    fs.accessSync(path, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = generate;


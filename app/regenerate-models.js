const P = require('bluebird');
const fs = require('fs');
const path = require('path');
const rimrafCb = require('rimraf');
const DB = require('../services/db');
const Dumper = require('../services/dumper');
const TableAnalyzer = require('../services/table-analyzer');

const rimraf = P.promisify(rimrafCb);

async function regenerateModels(config) {
  const modelsDir = path.join(config.appDir, 'models');

  // NOTICE: Ensure the models directory doesn't exist
  if (doesDirectoryExist(modelsDir)) {
    await rimraf(modelsDir);
  }

  const db = await new DB().connect(config);
  const schema = await new TableAnalyzer(db, config).perform();
  const dumper = new Dumper(null, config);

  await dumper.dumpSchema(schema);
}

function doesDirectoryExist(dirPath) {
  try {
    fs.accessSync(dirPath, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = regenerateModels;

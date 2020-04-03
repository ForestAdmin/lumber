const fs = require('fs');
const chalk = require('chalk');
const logger = require('./logger');
const { tableToFilename } = require('../utils/dumper-utils');

function Migrator() {
  this.detectNewTables = (schema) => {
    const newTables = [];

    const modelDir = `${process.cwd()}/models`;
    if (!fs.existsSync(modelDir)) {
      logger.error(
        `Cannot find the ${chalk.red('models/')} directory.`,
        'Please, ensure you are running this command inside a Lumber generated project.',
      );
      process.exit(1);
    }

    Object.keys(schema).forEach((table) => {
      const tableFileName = tableToFilename(table);
      const modelPath = `${process.cwd()}/models/${tableFileName}.js`;
      if (!fs.existsSync(modelPath)) {
        newTables.push(table);
      }
    });

    return newTables;
  };

  this.detectDeletedTables = (schema) => {
    const deletedTablesFilePaths = [];

    const modelDir = `${process.cwd()}/models`;
    if (!fs.existsSync(modelDir)) {
      logger.error(
        `Cannot find the ${chalk.red('models/')} directory.`,
        'Please, ensure you are running this command inside a Lumber generated project.',
      );
      process.exit(1);
    }

    const tableFileNames = Object.keys(schema).map((table) => `${tableToFilename(table)}.js`);
    const files = fs.readdirSync(`${process.cwd()}/models`);
    files.forEach((file) => {
      if (file !== 'index.js' && !tableFileNames.includes(file)) {
        deletedTablesFilePaths.push(file);
      }
    });

    return deletedTablesFilePaths;
  };

  this.detectNewFields = (schema) => {
    const newFields = {};

    Object.keys(schema).forEach((table) => {
      newFields[table] = [];
      const tableFileName = tableToFilename(table);
      const modelPath = `${process.cwd()}/models/${tableFileName}.js`;
      if (!fs.existsSync(modelPath)) { return; }

      const content = fs.readFileSync(modelPath, 'utf-8');

      schema[table].fields.forEach((field) => {
        const regexp = new RegExp(`['|"]?${field.name}['|"]?:\\s*{\\s*type:\\s*DataTypes..*[^}]*},?`);
        if (!regexp.test(content)) {
          newFields[table].push(field);
        }
      });
    });

    return newFields;
  };

  this.detectNewRelationships = (schema) => {
    const newRelationships = {};

    Object.keys(schema).forEach((table) => {
      newRelationships[table] = [];
      const tableFileName = tableToFilename(table);
      const modelPath = `${process.cwd()}/models/${tableFileName}.js`;
      if (!fs.existsSync(modelPath)) { return; }

      const content = fs.readFileSync(modelPath, 'utf-8');

      schema[table].references.forEach((reference) => {
        const regexpSimple = new RegExp(`foreignKey: ['"]${reference.foreignKey}['"]`);
        const regexpComplex = new RegExp(`foreignKey:\\s*{[\\s\\w',:]*field:\\s*['"]${reference.foreignKey}['"]`);
        if (!regexpSimple.test(content) && !regexpComplex.test(content)) {
          newRelationships[table].push(reference);
        }
      });
    });

    return newRelationships;
  };
}

module.exports = Migrator;

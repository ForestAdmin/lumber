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

  this.detectDeletedFields = (schema) => {
    const deletedFields = {};

    Object.keys(schema).forEach((table) => {
      deletedFields[table] = [];
      const tableFileName = tableToFilename(table);
      const modelPath = `${process.cwd()}/models/${tableFileName}.js`;
      if (!fs.existsSync(modelPath)) { return; }

      const content = fs.readFileSync(modelPath, 'utf-8');
      const actualFieldNames = [];
      const regex = /['"]?(\w+)['"]?:\s*{\s*[^}]*type:\s*DataTypes..*[^}]*},?/gm;

      let match = regex.exec(content);
      while (match !== null) {
        // NOTICE: Extract the capturing group corresponding to the field name
        actualFieldNames.push(match[1]);

        // NOTICE: Find the next field
        match = regex.exec(content);
      }

      const newfieldNames = schema[table].fields.map((field) => field.name);
      deletedFields[table] = actualFieldNames
        .filter((fieldName) => !newfieldNames.includes(fieldName));
    });

    return deletedFields;
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

  this.detectDeletedRelationships = (schema) => {
    const deletedRelationships = {};

    Object.keys(schema).forEach((table) => {
      deletedRelationships[table] = [];
      const tableFileName = tableToFilename(table);
      const modelPath = `${process.cwd()}/models/${tableFileName}.js`;
      if (!fs.existsSync(modelPath)) { return; }

      const content = fs.readFileSync(modelPath, 'utf-8');
      const actualReferenceNames = [];
      const regex = /\w+\s*\.\s*(belongsToMany|belongsTo|hasMany|hasOne)\s*\(\s*models\.\w+,\s*{\s*[\s\w',:]*foreignKey:\s*({[\s\w',:]*field:\s*['"](\w+)['"],?\s*}|\s*['"](\w+)['"]),?[^}]*}\);?/gm;

      let match = regex.exec(content);
      while (match !== null) {
        // NOTICE: Extract the capturing group corresponding to the field name
        actualReferenceNames.push(match[3] || match[4]);

        // NOTICE: Find the next field
        match = regex.exec(content);
      }

      const newReferenceNames = schema[table].references.map((reference) => reference.foreignKey);
      deletedRelationships[table] = actualReferenceNames
        .filter((foreignKeyName) => !newReferenceNames.includes(foreignKeyName));
    });

    return deletedRelationships;
  };
}

module.exports = Migrator;

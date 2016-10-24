'use strict';
const fs = require('fs');
const _ = require('lodash');
const program = require('commander');
const chalk = require('chalk');

function isDirectoryExist(path) {
  try {
    fs.accessSync(path, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

program
  .description('Generate a new action.')
  .arguments('<collectionName> <actionName>')
  .parse(process.argv);

if (program.args.length !== 2) {
  program.outputHelp();
  process.exit(1);
}

if (!/^[a-z0-9-]*$/.test(program.args[1])) {
  console.log(`💀  The action name should only contains lowercase \
alphanumeric characters and dash.💀`);
  process.exit(1);
}

let routePath = `${process.cwd()}/routes/${program.args[0]}.js`;

function writeDeclaration() {
  let templatePath = `${__dirname}/templates/action/declaration.txt`;
  let template = _.template(fs.readFileSync(templatePath, 'utf-8'));
  let text = template({
    collectionName: program.args[0],
    actionName: program.args[1]
  });

  fs.writeFileSync(`${process.cwd()}/forest/${program.args[0]}.js`, text);
}

function writeRoute() {
  let templatePath = `${__dirname}/templates/action/route.txt`;
  let template = _.template(fs.readFileSync(templatePath, 'utf-8'));
  let text = template({ actionName: program.args[1] });

  fs.writeFileSync(routePath, text);
}

function extendRoute() {
  let templatePath = `${__dirname}/templates/action/route-extend.txt`;
  let template = _.template(fs.readFileSync(templatePath, 'utf-8'));
  let newContent = template({ actionName: program.args[1] });
  let currentContent = fs.readFileSync(routePath, 'utf-8');
  const regexp = /\n(module.exports)/;

  if (regexp.test(currentContent)) {
    newContent = currentContent.replace(regexp, `${newContent}\n$1`);
    fs.writeFileSync(routePath, newContent);
  } else {
    console.log(chalk.bold(`WARNING: Cannot add the route definition \
automatically. Please, add it manually to the file '${routePath}'.`));
  }
}

function extendDeclaration() {
  let declarationPath = `${process.cwd()}/forest/${program.args[0]}.js`;
  let templatePath = `${__dirname}/templates/action/declaration-extend.txt`;
  let template = _.template(fs.readFileSync(templatePath, 'utf-8'));
  let newContent = template({ actionName: program.args[1] });
  newContent = newContent.replace(/\n$/, '');

  let currentContent = fs.readFileSync(declarationPath, 'utf-8');
  const regexp = /([ t]+{ name: .*},)/;

  if (regexp.test(currentContent)) {
    newContent = currentContent.replace(regexp, `$1\n${newContent}`);
    fs.writeFileSync(declarationPath, newContent);
  } else {
    console.log(chalk.bold(`WARNING: Cannot add the route declaration \
automatically. Please, add it manually to the file '${declarationPath}'.`));
  }

}

if (isDirectoryExist(routePath)) {
  extendRoute();
  extendDeclaration();
} else {
  writeDeclaration();
  writeRoute();
}



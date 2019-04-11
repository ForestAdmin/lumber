const express = require('express');
const requireAll = require('require-all');

const app = express();

requireAll({
  dirname: __dirname + '/middlewares',
  recursive: true,
  resolve: Module => new Module(app),
});

module.exports = app;

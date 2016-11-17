'use strict';
var fs = require('fs');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('express-cors');
var jwt = require('express-jwt');

var app = express();

app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  allowedOrigins: ['*.forestadmin.com'],
  headers: ['Authorization', 'X-Requested-With', 'Content-Type']
}));

app.use(jwt({
  secret: process.env.FOREST_AUTH_KEY,
  credentialsRequired: false
}));

fs.readdirSync('./routes').forEach((file) => {
  if (file !== '.gitkeep') {
    app.use('/forest', require(`./routes/${file}`));
  }
});

app.use(require('forest-express-sequelize').init({
  modelsDir: __dirname + '/models',
  secretKey: process.env.FOREST_SECRET_KEY,
  authKey: process.env.FOREST_AUTH_KEY,
  sequelize: require('./models').sequelize
}));

module.exports = app;

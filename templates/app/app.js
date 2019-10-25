const express = require('express');
const requireAll = require('require-all');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('express-jwt');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: /forestadmin\.com$<% if (forestUrl) { %>|^localhost:\d{4}$<% } %>/,
  allowedHeaders: ['Authorization', 'X-Requested-With', 'Content-Type'],
  maxAge: 86400, // NOTICE: 1 day
  credentials: true,
}));

app.use(jwt({
  secret: process.env.FOREST_AUTH_SECRET,
  credentialsRequired: false,
}));

requireAll({
  dirname: path.join(__dirname, 'routes'),
  recursive: true,
  resolve: Module => app.use('/forest', Module),
});

requireAll({
  dirname: path.join(__dirname, 'middlewares'),
  recursive: true,
  resolve: Module => new Module(app),
});

module.exports = app;

const fs = require('fs');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('express-cors');
const jwt = require('express-jwt');
const ApolloServerExpress = require('apollo-server-express');
const GraphQLStitcher = require('graphql-stitcher');
const Liana = require('forest-express-<% if (config.dbDialect === "mongodb") { %>mongoose<% } else {%>sequelize<% } %>');

const app = express();

app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  allowedOrigins: ['*.forestadmin.com'],
  headers: ['Authorization', 'X-Requested-With', 'Content-Type'],
}));

app.use(jwt({
  secret: process.env.AUTH_SECRET,
  credentialsRequired: false
}));

Liana.init({
<% if (config.dbDialect) { %>  modelsDir: __dirname + '/models',<% } %>
<% if (config.dbDialect) { %><% if (config.dbDialect === 'mongodb') { %>  mongoose: require('mongoose')<% } else { %>  sequelize: require('./models').sequelize<% } %><% } %>,
  onlyCrudModule: true
});

(async () => {
  const stitcher = new GraphQLStitcher(<% if (config.dbDialect) { %><% if (config.dbDialect === 'mongodb') { %> { mongoose: require('mongoose') }<% } else { %> { sequelize: require('./models').Sequelize }<% } %><% } %>);

  stitcher.addScalar('DateTime');
  stitcher.addScalar('JSON');

  const dbSchema = stitcher.createLocalSchema(__dirname + '/graphql');

  const server = new ApolloServerExpress.ApolloServer({
    introspection: true,
    playground: true,
    schema: stitcher.stitch(),
  });

  server.applyMiddleware({ app, path: '/graphql' });
})().catch((err) => {
  console.error(err);
});

module.exports = app;

'use strict';
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

const app = express();

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
  secret: process.env.FOREST_AUTH_SECRET,
  credentialsRequired: false
}));

fs.readdirSync('./routes').forEach((file) => {
  if (file !== '.gitkeep') {
    app.use('/forest', require('./routes/' + file));
  }
});

(async () => {
  const schemaManager = new GraphQLStitcher();
  const dbSchema = schemaManager.createLocalSchema(__dirname + '/graphql', ApolloServerExpress.gql`
    scalar DateTime

    type Query {
      _: Boolean
    }

    type Mutation {
      _: Boolean
    }

    type Subscription {
      _: Boolean
    }
  `);

  const server = new ApolloServerExpress.ApolloServer({
    introspection: true,
    playground: true,
    schema: schemaManager.stitch(),
  });

  server.applyMiddleware({ app, path: '/graphql' });

  app.use(require('forest-express-<% if (config.dbDialect === "mongodb") { %>mongoose<% } else {%>sequelize<% } %>').init({
  <% if (config.dbDialect) { %>  modelsDir: __dirname + '/models',<% } %>
    envSecret: process.env.FOREST_ENV_SECRET,
    authSecret: process.env.FOREST_AUTH_SECRET,
  <% if (config.dbDialect) { %><% if (config.dbDialect === 'mongodb') { %>  mongoose: require('mongoose')<% } else { %>  sequelize: require('./models').sequelize<% } %><% } %>
  }));
})().catch((err) => {
  console.error(err);
});

module.exports = app;

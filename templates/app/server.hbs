require('dotenv').config();
const debug = require('debug')('{name}:server');
const http = require('http');
const chalk = require('chalk');
const app = require('./app');

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) { return val; }
  if (port >= 0) { return port; }

  return false;
}

const port = normalizePort(process.env.PORT || process.env.APPLICATION_PORT || '3310');
app.set('port', port);

const server = http.createServer(app);
server.listen(port);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  debug(`Listening on ${bind}`);

  console.log(chalk.cyan(`Your application is listening on ${bind}.`));
}

server.on('error', onError);
server.on('listening', onListening);

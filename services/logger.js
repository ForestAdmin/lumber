const winston = require('winston');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { colorize: true });

module.exports = winston;

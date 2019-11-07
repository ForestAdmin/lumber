const dotenv = require('dotenv');

const logger = require('../../services/logger');

const ENV = process.env.ENV || '.env-test';

logger.info(`LOADING ENV ${ENV}`);
const result = dotenv.config({ path: `${__dirname}/../../${ENV}` });

if (result.error) {
  throw result.error;
}

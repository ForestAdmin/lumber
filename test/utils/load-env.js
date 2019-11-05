const dotenv = require('dotenv');

const ENV = process.env.ENV || '.env-test-max-version';

dotenv.config({ path: `${__dirname}/../../${ENV}` });

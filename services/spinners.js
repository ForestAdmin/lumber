const Spinnies = require('spinnies');
const logger = require('./logger');

const spinnies = new Spinnies({
  spinnerColor: 'blue',
  spinner: {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  },
});

module.exports = {
  add(key, options, promise = null) {
    spinnies.add(key, options);

    const spinner = {
      succeed(succeedOptions) {
        spinnies.succeed(key, succeedOptions);
      },
      fail(failOptions) {
        spinnies.fail(key, failOptions);
      },
      pause() {
        spinnies.remove(key);
        spinnies.stopAll();
      },
      continue() {
        spinnies.add(key, options);
      },
    };
    logger.spinner = spinner;

    if (promise) {
      promise
        .then((result) => {
          logger.spinner = null;
          spinner.succeed();
          return result;
        })
        .catch((error) => {
          logger.spinner = null;
          spinner.fail();
          throw error;
        });
    }

    return spinner;
  },
};

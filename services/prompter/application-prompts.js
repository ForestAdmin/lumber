const PromptUtils = require('./prompt-utils');

class ApplicationPrompts extends PromptUtils {
  constructor(program, envConfig, prompts, requests) {
    super(requests);
    this.program = program;
    this.envConfig = envConfig;
    this.prompts = prompts;
  }

  handlePrompts() {
    this.handleHostName();
    this.handleAppPort();
  }

  handleHostName() {
    if (this.isOptionRequested('appHostname')) {
      this.envConfig.appHostname = this.program.applicationHost;
      if (!this.envConfig.appHostname) {
        this.prompts.push({
          type: 'input',
          name: 'appHostname',
          message: 'What\'s the IP/hostname on which your application will be running? ',
          default: 'localhost',
        });
      }
    }
  }

  handleAppPort() {
    if (this.isOptionRequested('appPort')) {
      this.envConfig.appPort = this.program.applicationPort;
      if (!this.envConfig.appPort) {
        this.prompts.push({
          type: 'input',
          name: 'appPort',
          message: 'What\'s the port on which your application will be running? ',
          default: '3310',
          validate: (port) => {
            if (!/^\d+$/.test(port)) {
              return 'The port must be a number.';
            }

            const parsedPort = parseInt(port, 10);
            if (parsedPort > 0 && parsedPort < 65536) { return true; }
            return 'This is not a valid port.';
          },
        });
      }
    }
  }
}

module.exports = ApplicationPrompts;

const AbstractPrompter = require('./abstract-prompter');

class ApplicationPrompts extends AbstractPrompter {
  constructor(requests, program, envConfig, prompts) {
    super(requests);
    this.program = program;
    this.envConfig = envConfig;
    this.prompts = prompts;
  }

  async handlePrompts() {
    this.handleHostname();
    this.handlePort();
  }

  handleHostname() {
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

  handlePort() {
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

const AbstractPrompter = require('./abstract-prompter');

class ApplicationPrompts extends AbstractPrompter {
  constructor(requests, envConfig, prompts, program) {
    super(requests);
    this.envConfig = envConfig;
    this.prompts = prompts;
    this.program = program;
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
          default: 'http://localhost',
          validate: (hostname) => {
            if (!/^https?:\/\/.*/i.test(hostname)) {
              return 'Application hostname must be a valid url.';
            }
            if (!/^http((s:\/\/.*)|(s?:\/\/(localhost|127\.0\.0\.1).*))/i.test(hostname)) {
              return 'HTTPS protocol is mandatory, except for localhost and 127.0.0.1.';
            }
            return true;
          },
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

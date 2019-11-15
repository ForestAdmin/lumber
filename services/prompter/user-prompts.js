const AbstractPrompter = require('./abstract-prompter');

class UserPrompts extends AbstractPrompter {
  constructor(requests, envConfig, prompts, program) {
    super(requests);
    this.envConfig = envConfig;
    this.prompts = prompts;
    this.program = program;
  }

  async handlePrompts() {
    this.handleEmail();
    this.handlePassword();
    this.handleToken();
  }

  handleEmail() {
    if (this.isOptionRequested('email')) {
      this.envConfig.email = this.program.email;

      if (!this.envConfig.email) {
        this.prompts.push({
          type: 'input',
          name: 'email',
          message: 'What\'s your email address? ',
          validate: (email) => {
            if (email) { return true; }
            return 'Please enter your email address.';
          },
        });
      }
    }
  }

  handlePassword() {
    this.envConfig.password = this.program.password;
  }

  handleToken() {
    this.envConfig.token = this.program.token;
  }
}

module.exports = UserPrompts;

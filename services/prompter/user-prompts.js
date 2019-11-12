const AbstractPrompter = require('./abstract-prompter');

class UserPrompts extends AbstractPrompter {
  constructor(requests, envConfig, prompts) {
    super(requests);
    this.envConfig = envConfig;
    this.prompts = prompts;
    this.FORMAT_PASSWORD = /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{8,}$/;
  }

  handlePrompts() {
    this.handleEmail();
    this.handleCreatePassword();
    this.handlePassword();
  }

  handleEmail() {
    if (this.isOptionRequested('email')) {
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

  handleCreatePassword() {
    if (this.isOptionRequested('passwordCreate')) {
      if (!this.envConfig.authToken) {
        this.prompts.push({
          type: 'password',
          name: 'password',
          message: 'Choose a password: ',
          validate: (password) => {
            if (password) {
              if (this.FORMAT_PASSWORD.test(password)) { return true; }
              return '🔓  Your password security is too weak 🔓\n' +
                ' Please make sure it contains at least:\n' +
                '    > 8 characters\n' +
                '    > Upper and lower case letters\n' +
                '    > Numbers';
            }

            return 'Your password cannot be blank.';
          },
        });
      }
    }
  }

  handlePassword() {
    if (this.isOptionRequested('password')) {
      this.prompts.push({
        type: 'password',
        name: 'password',
        message: 'What\'s your password: ',
        validate: (password) => {
          if (password) { return true; }
          return 'Your password cannot be blank.';
        },
      });
    }
  }
}

module.exports = UserPrompts;

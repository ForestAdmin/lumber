const { describe, it, after } = require('mocha');
const { expect } = require('chai');
const UserPrompts = require('../../../services/prompter/user-prompts');

describe('Services > Prompter > User prompts', () => {
  describe('Handling email prompt : ', () => {
    describe('when the email option is requested', () => {
      const envConfig = {};
      const requests = ['email'];
      let prompts = [];

      describe('and the email has not been passed in', () => {
        after(() => {
          prompts = [];
        });

        const userPrompts = new UserPrompts(envConfig, prompts, requests);

        it('should add a prompt to ask for it', () => {
          expect(prompts).to.have.lengthOf(0);

          userPrompts.handleEmail();

          expect(prompts).to.have.lengthOf(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect(prompts[0].type).to.equal('input');
          expect(prompts[0].name).to.equal('email');
          expect(prompts[0].message).to.equal('What\'s your email address? ');
          expect(prompts[0].validate).to.be.a('function');
        });

        it('should validate that the email has been field', () => {
          expect(prompts[0].validate('fake@email.com')).to.equal(true);
          expect(prompts[0].validate(null)).to.equal('Please enter your email address.');
        });
      });

      describe('and the email has already been passed in', () => {
        after(() => {
          prompts = [];
        });

        const envConfigWithEmail = {
          email: 'fake@email.com',
        };
        const userPrompts = new UserPrompts(envConfigWithEmail, prompts, requests);

        it('should not add an additional prompt', () => {
          expect(prompts).to.have.lengthOf(0);

          userPrompts.handleEmail();

          expect(prompts).to.have.lengthOf(0);
        });
      });
    });

    describe('when the email option is not requested', () => {
      const envConfig = {};
      const requests = [];
      const prompts = [];

      const userPrompts = new UserPrompts(envConfig, prompts, requests);

      it('should not add an additional prompt', () => {
        expect(prompts).to.have.lengthOf(0);

        userPrompts.handleEmail();

        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('handling create password prompt', () => {
    describe('when the passwordCreate option is requested', () => {
      const envConfig = {};
      const requests = ['passwordCreate'];
      let prompts = [];

      describe('and the auth token have not been passed in', () => {
        after(() => {
          prompts = [];
        });

        const userPrompts = new UserPrompts(envConfig, prompts, requests);

        it('should add a prompt to ask for a new password', () => {
          expect(prompts).to.have.lengthOf(0);

          userPrompts.handleCreatePassword();

          expect(prompts).to.have.lengthOf(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect(prompts[0].type).to.equal('password');
          expect(prompts[0].name).to.equal('password');
          expect(prompts[0].message).to.equal('Choose a password: ');
          expect(prompts[0].validate).to.be.a('function');
        });

        it('should validate that the password has been field', () => {
          expect(prompts[0].validate(null)).to.equal('Your password cannot be blank.');
        });

        it('should ensure that the password matches security rules', () => {
          const errorMessage = '🔓  Your password security is too weak 🔓\n' +
            ' Please make sure it contains at least:\n' +
            '    > 8 characters\n' +
            '    > Upper and lower case letters\n' +
            '    > Numbers';

          expect(prompts[0].validate('notStrongEnough')).to.equal(errorMessage);
          expect(prompts[0].validate('StrongPassword11@')).to.equal(true);
        });
      });

      describe('and the auth token have already been passed in', () => {
        after(() => {
          prompts = [];
        });

        const envConfigWithAuthToken = {
          authToken: 'fakeToken',
        };
        const userPrompts = new UserPrompts(envConfigWithAuthToken, prompts, requests);

        it('should not add an additional prompt', () => {
          expect(prompts).to.have.lengthOf(0);

          userPrompts.handleCreatePassword();

          expect(prompts).to.have.lengthOf(0);
        });
      });
    });

    describe('when the passwordCreate option is not requested', () => {
      const envConfig = {};
      const requests = [];
      const prompts = [];

      const userPrompts = new UserPrompts(envConfig, prompts, requests);

      it('should not add an additional prompt', () => {
        expect(prompts).to.have.lengthOf(0);

        userPrompts.handleCreatePassword();

        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('handling password prompt', () => {
    describe('when the password option is requested', () => {
      const envConfig = {};
      const requests = ['password'];
      const prompts = [];

      const userPrompts = new UserPrompts(envConfig, prompts, requests);

      it('should add a prompt to ask for the user password', () => {
        expect(prompts).to.have.lengthOf(0);

        userPrompts.handlePassword();

        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('password');
        expect(prompts[0].name).to.equal('password');
        expect(prompts[0].message).to.equal('What\'s your password: ');
        expect(prompts[0].validate).to.be.a('function');
      });

      it('should validate that the password has been field', () => {
        expect(prompts[0].validate(null)).to.equal('Your password cannot be blank.');
        expect(prompts[0].validate('fakePassword')).to.equal(true);
      });
    });

    describe('when the password option is not requested', () => {
      const envConfig = {};
      const requests = [];
      const prompts = [];

      const userPrompts = new UserPrompts(envConfig, prompts, requests);

      it('should not add an additional prompt', () => {
        expect(prompts).to.have.lengthOf(0);

        userPrompts.handlePassword();

        expect(prompts).to.have.lengthOf(0);
      });
    });
  });
});

const sinon = require('sinon');
const UserPrompts = require('../../../services/prompter/user-prompts');

const EMAIL_FAKE = 'fake@email.com';

describe('services > prompter > user prompts', () => {
  let envConfig = {};
  let requests = [];
  let prompts = [];
  let program = {};

  function resetParams() {
    envConfig = {};
    requests = [];
    prompts = [];
    program = {};
  }

  describe('handling user related prompts', () => {
    it('should handle the email', async () => {
      expect.assertions(1);
      const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
      const emailHandlerStub = sinon.stub(userPrompts, 'handleEmail');
      await userPrompts.handlePrompts();
      expect(emailHandlerStub.calledOnce).toStrictEqual(true);
      emailHandlerStub.restore();
      resetParams();
    });

    it('should handle the password', async () => {
      expect.assertions(1);
      const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
      const passwordHandlerStub = sinon.stub(userPrompts, 'handlePassword');
      await userPrompts.handlePrompts();
      expect(passwordHandlerStub.calledOnce).toStrictEqual(true);
      passwordHandlerStub.restore();
      resetParams();
    });

    it('should handle the token', async () => {
      expect.assertions(1);
      const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
      const tokenHandlerStub = sinon.stub(userPrompts, 'handleToken');
      await userPrompts.handlePrompts();
      expect(tokenHandlerStub.calledOnce).toStrictEqual(true);
      tokenHandlerStub.restore();
      resetParams();
    });
  });

  describe('handling email prompt', () => {
    describe('when the email option is requested', () => {
      describe('and the email has not been passed in', () => {
        it('should add a prompt to ask for it', () => {
          expect.assertions(2);
          requests.push('email');
          const userPrompts = new UserPrompts(requests, envConfig, prompts, program);

          expect(prompts).toHaveLength(0);
          userPrompts.handleEmail();
          expect(prompts).toHaveLength(1);
          resetParams();
        });

        it('should add a prompt with the correct configuration', () => {
          expect.assertions(4);
          requests.push('email');
          const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
          userPrompts.handleEmail();

          expect(prompts[0].type).toStrictEqual('input');
          expect(prompts[0].name).toStrictEqual('email');
          expect(prompts[0].message).toStrictEqual('What\'s your email address? ');
          expect(prompts[0].validate).toBeInstanceOf(Function);
          resetParams();
        });

        it('should validate that the email has been field', () => {
          expect.assertions(2);
          requests.push('email');
          const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
          userPrompts.handleEmail();

          expect(prompts[0].validate(EMAIL_FAKE)).toStrictEqual(true);
          expect(prompts[0].validate(null)).toStrictEqual('Please enter your email address.');
          resetParams();
        });
      });

      describe('and the email has already been passed in', () => {
        it('should add the email to the configuration', async () => {
          expect.assertions(2);
          requests.push('email');
          program.email = EMAIL_FAKE;
          const userPrompts = new UserPrompts(requests, envConfig, prompts, program);

          expect(envConfig.email).toBeUndefined();
          userPrompts.handleEmail();
          expect(envConfig.email).toStrictEqual(EMAIL_FAKE);
          resetParams();
        });

        it('should not add an additional prompt', () => {
          expect.assertions(2);
          requests.push('email');
          program.email = EMAIL_FAKE;
          const userPrompts = new UserPrompts(requests, envConfig, prompts, program);

          expect(prompts).toHaveLength(0);
          userPrompts.handleEmail();
          expect(prompts).toHaveLength(0);
          resetParams();
        });
      });
    });

    describe('when the email option is not requested', () => {
      it('should not add an additional prompt', () => {
        expect.assertions(2);
        const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
        expect(prompts).toHaveLength(0);

        userPrompts.handleEmail();
        expect(prompts).toHaveLength(0);
        resetParams();
      });
    });
  });

  describe('handling password', () => {
    describe('when the password has already been passed in', () => {
      it('should add the password to the configuration', () => {
        expect.assertions(3);
        program.password = 'password';
        const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
        expect(envConfig.password).toBeUndefined();

        userPrompts.handlePassword();

        expect(envConfig.password).not.toBeUndefined();
        expect(envConfig.password).toStrictEqual('password');
        resetParams();
      });
    });

    describe('when the password has not been passed in', () => {
      it('should not add the password to the configuration', () => {
        expect.assertions(2);
        const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
        expect(envConfig.password).toBeUndefined();

        userPrompts.handlePassword();

        expect(envConfig.password).toBeUndefined();
        resetParams();
      });
    });
  });

  describe('handling token', () => {
    describe('when the token has already been passed in', () => {
      it('should add the token to the configuration', () => {
        expect.assertions(3);
        program.token = 'fake token';
        const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
        expect(envConfig.token).toBeUndefined();

        userPrompts.handleToken();

        expect(envConfig.token).not.toBeUndefined();
        expect(envConfig.token).toStrictEqual('fake token');
        resetParams();
      });
    });

    describe('when the token has not been passed in', () => {
      it('should not add the token to the configuration', () => {
        expect.assertions(2);
        const userPrompts = new UserPrompts(requests, envConfig, prompts, program);
        expect(envConfig.token).toBeUndefined();

        userPrompts.handleToken();

        expect(envConfig.token).toBeUndefined();
        resetParams();
      });
    });
  });
});

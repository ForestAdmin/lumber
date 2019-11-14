const {
  describe,
  it,
  after,
  before,
} = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const UserPrompts = require('../../../services/prompter/user-prompts');

describe('Services > Prompter > User prompts', () => {
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

  describe('Handling user related prompts', () => {
    let userPrompts;
    let emailHandlerStub;
    let passwordHandlerStub;
    let tokenHandlerStub;

    before(async () => {
      userPrompts = new UserPrompts(requests, envConfig, prompts, program);
      emailHandlerStub = sinon.stub(userPrompts, 'handleEmail');
      passwordHandlerStub = sinon.stub(userPrompts, 'handlePassword');
      tokenHandlerStub = sinon.stub(userPrompts, 'handleToken');
      await userPrompts.handlePrompts();
    });

    after(() => {
      emailHandlerStub.restore();
      passwordHandlerStub.restore();
      tokenHandlerStub.restore();
      resetParams();
    });

    it('should handle the email', () => {
      expect(emailHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the password', () => {
      expect(passwordHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the token', () => {
      expect(tokenHandlerStub.calledOnce).to.equal(true);
    });
  });

  describe('Handling email prompt : ', () => {
    after(() => {
      resetParams();
    });

    describe('When the email option is requested', () => {
      before(() => {
        requests.push('email');
      });

      after(() => {
        resetParams();
      });

      describe('And the email has not been passed in', () => {
        let userPrompts;

        before(() => {
          userPrompts = new UserPrompts(requests, envConfig, prompts, program);
        });

        after(() => {
          prompts = [];
        });

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

      describe('And the email has already been passed in', () => {
        before(() => {
          program.email = 'fake@email.com';
        });

        after(() => {
          resetParams();
        });

        it('should add the email to the configuration', async () => {
          const userPrompts = new UserPrompts(requests, envConfig, prompts, program);

          expect(envConfig.email).to.equal(undefined);

          userPrompts.handleEmail();

          expect(envConfig.email).to.equal('fake@email.com');
        });

        it('should not add an additional prompt', () => {
          const userPrompts = new UserPrompts(requests, envConfig, prompts, program);

          expect(prompts).to.have.lengthOf(0);

          userPrompts.handleEmail();

          expect(prompts).to.have.lengthOf(0);
        });
      });
    });

    describe('When the email option is not requested', () => {
      const userPrompts = new UserPrompts(requests, envConfig, prompts, program);

      it('should not add an additional prompt', () => {
        expect(prompts).to.have.lengthOf(0);

        userPrompts.handleEmail();

        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling password :', () => {
    describe('When the password has already been passed in', () => {
      let userPrompts;

      before(() => {
        program.password = 'password';
        userPrompts = new UserPrompts(requests, envConfig, prompts, program);
      });

      after(() => {
        resetParams();
      });

      it('should add the password to the configuration', () => {
        expect(envConfig.password).to.equal(undefined);

        userPrompts.handlePassword();

        expect(envConfig.password).to.not.equal(undefined);
        expect(envConfig.password).to.equal('password');
      });
    });

    describe('When the password has not been passed in', () => {
      let userPrompts;

      before(() => {
        userPrompts = new UserPrompts(requests, envConfig, prompts, program);
      });

      after(() => {
        resetParams();
      });

      it('should not add the password to the configuration', () => {
        expect(envConfig.password).to.equal(undefined);

        userPrompts.handlePassword();

        expect(envConfig.password).to.equal(undefined);
      });
    });
  });

  describe('Handling token :', () => {
    describe('When the token has already been passed in', () => {
      let userPrompts;

      before(() => {
        program.token = 'fake token';
        userPrompts = new UserPrompts(requests, envConfig, prompts, program);
      });

      after(() => {
        resetParams();
      });

      it('should add the token to the configuration', () => {
        expect(envConfig.token).to.equal(undefined);

        userPrompts.handleToken();

        expect(envConfig.token).to.not.equal(undefined);
        expect(envConfig.token).to.equal('fake token');
      });
    });

    describe('When the token has not been passed in', () => {
      let userPrompts;

      before(() => {
        userPrompts = new UserPrompts(requests, envConfig, prompts, program);
      });

      after(() => {
        resetParams();
      });

      it('should not add the token to the configuration', () => {
        expect(envConfig.token).to.equal(undefined);

        userPrompts.handleToken();

        expect(envConfig.token).to.equal(undefined);
      });
    });
  });
});

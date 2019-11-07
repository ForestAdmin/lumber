const {
  describe,
  it,
  after,
  before,
} = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const ApplicationPrompts = require('../../../services/prompter/application-prompts');

const FAKE_APP_HOST = 'fakeApplicationHost';
const FAKE_APP_PORT = '1234';

describe('Services > Prompter > Application prompts', () => {
  let envConfig = {};
  let requests = [];
  let program = {};
  let prompts = [];

  function resetParams() {
    envConfig = {};
    requests = [];
    program = {};
    prompts = [];
  }

  describe('Handling application related prompts', () => {
    let applicationPrompts;
    let hostNameHandlerStub;
    let portHandlerStub;

    before(() => {
      applicationPrompts = new ApplicationPrompts(program, envConfig, prompts, requests);
      hostNameHandlerStub = sinon.stub(applicationPrompts, 'handleHostName');
      portHandlerStub = sinon.stub(applicationPrompts, 'handleAppPort');
      applicationPrompts.handlePrompts();
    });

    after(() => {
      hostNameHandlerStub.restore();
      portHandlerStub.restore();
      resetParams();
    });

    it('should handle the host name', () => {
      expect(hostNameHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the port', () => {
      expect(portHandlerStub.calledOnce).to.equal(true);
    });
  });

  describe('Handling host name : ', () => {
    describe('When the appHostName option is requested', () => {
      describe('and the appHostName has not been passed in', async () => {
        before(() => {
          requests.push('appHostname');
        });

        after(() => {
          resetParams();
        });

        const applicationPrompts = new ApplicationPrompts(program, envConfig, prompts, requests);

        await applicationPrompts.handleHostName();

        it('should add a prompt to ask for for it', () => {
          expect(prompts).to.have.lengthOf(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect(prompts[0].type).to.equal('input');
          expect(prompts[0].name).to.equal('appHostname');
          expect(prompts[0].message).to.equal('What\'s the IP/hostname on which your application will be running? ');
          expect(prompts[0].default).to.equal('localhost');
        });

        it('should not change the configuration', () => {
          expect(envConfig.appHostname).to.equal(undefined);
        });
      });

      describe('and the appHostName has already been passed in', async () => {
        before(() => {
          requests.push('appHostname');
        });

        after(() => {
          resetParams();
        });

        program.applicationHost = FAKE_APP_HOST;

        const applicationPrompts = new ApplicationPrompts(program, envConfig, prompts, requests);

        await applicationPrompts.handleHostName();

        it('should not add any prompt', () => {
          expect(prompts).to.have.lengthOf(0);
        });

        it('should add the appHostname to the configuration', () => {
          expect(envConfig.appHostname).to.equal(FAKE_APP_HOST);
        });
      });
    });

    describe('When the appHostname option is not requested', () => {
      const applicationPrompts = new ApplicationPrompts(program, envConfig, prompts, requests);

      it('should not do anything', async () => {
        expect(envConfig.appHostname).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        await applicationPrompts.handleHostName();

        expect(envConfig.appHostname).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling port : ', () => {
    describe('When the appPort option is requested', () => {
      describe('and the appPort has not been passed in', async () => {
        before(() => {
          requests.push('appPort');
        });

        after(() => {
          resetParams();
        });

        const applicationPrompts = new ApplicationPrompts(program, envConfig, prompts, requests);

        await applicationPrompts.handleAppPort();

        it('should add a prompt to ask for for it', () => {
          expect(prompts).to.have.lengthOf(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect(prompts[0].type).to.equal('input');
          expect(prompts[0].name).to.equal('appPort');
          expect(prompts[0].message).to.equal('What\'s the port on which your application will be running? ');
          expect(prompts[0].default).to.equal('3310');
          expect(prompts[0].validate).to.be.a('function');
        });

        it('should validate the port', () => {
          expect(prompts[0].validate(FAKE_APP_PORT)).to.equal(true);
          expect(prompts[0].validate('non number port')).to.equal('The port must be a number.');
          expect(prompts[0].validate(70000)).to.equal('This is not a valid port.');
        });

        it('should not change the configuration', () => {
          expect(envConfig.appPort).to.equal(undefined);
        });
      });

      describe('and the appPort has already been passed in', async () => {
        before(() => {
          requests.push('appPort');
        });

        after(() => {
          resetParams();
        });

        program.applicationHost = FAKE_APP_PORT;

        const applicationPrompts = new ApplicationPrompts(program, envConfig, prompts, requests);

        await applicationPrompts.handleHostName();

        it('should not add any prompt', () => {
          expect(prompts).to.have.lengthOf(0);
        });

        it('should add the appPort to the configuration', () => {
          expect(envConfig.appPort).to.equal(FAKE_APP_PORT);
        });
      });
    });

    describe('When the appPort option is not requested', () => {
      const applicationPrompts = new ApplicationPrompts(program, envConfig, prompts, requests);

      it('should not do anything', async () => {
        expect(envConfig.appPort).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        await applicationPrompts.handleHostName();

        expect(envConfig.appPort).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });
});

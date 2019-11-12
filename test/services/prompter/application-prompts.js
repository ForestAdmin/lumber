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
    let hostnameHandlerStub;
    let portHandlerStub;

    before(async () => {
      applicationPrompts = new ApplicationPrompts(requests, program, envConfig, prompts);
      hostnameHandlerStub = sinon.stub(applicationPrompts, 'handleHostname');
      portHandlerStub = sinon.stub(applicationPrompts, 'handlePort');
      await applicationPrompts.handlePrompts();
    });

    after(() => {
      hostnameHandlerStub.restore();
      portHandlerStub.restore();
      resetParams();
    });

    it('should handle the host name', () => {
      expect(hostnameHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the port', () => {
      expect(portHandlerStub.calledOnce).to.equal(true);
    });
  });

  describe('Handling host name : ', () => {
    describe('When the appHostname option is requested', () => {
      describe('and the appHostname has not been passed in', () => {
        let applicationPrompts;

        before(() => {
          requests.push('appHostname');
          applicationPrompts = new ApplicationPrompts(requests, program, envConfig, prompts);
          applicationPrompts.handleHostname();
        });

        after(() => {
          resetParams();
        });

        it('should add a prompt to ask for it', () => {
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

      describe('and the appHostname has already been passed in', () => {
        let applicationPrompts;

        before(() => {
          requests.push('appHostname');
          program.applicationHost = FAKE_APP_HOST;

          applicationPrompts = new ApplicationPrompts(requests, program, envConfig, prompts);
          applicationPrompts.handleHostname();
        });

        after(() => {
          resetParams();
        });

        it('should not add any prompt', () => {
          expect(prompts).to.have.lengthOf(0);
        });

        it('should add the appHostname to the configuration', () => {
          expect(envConfig.appHostname).to.equal(FAKE_APP_HOST);
        });
      });
    });

    describe('When the appHostname option is not requested', () => {
      const applicationPrompts = new ApplicationPrompts(requests, program, envConfig, prompts);

      it('should not do anything', () => {
        expect(envConfig.appHostname).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        applicationPrompts.handleHostname();

        expect(envConfig.appHostname).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling port : ', () => {
    describe('When the appPort option is requested', () => {
      describe('and the appPort has not been passed in', () => {
        let applicationPrompts;

        before(() => {
          requests.push('appPort');
          applicationPrompts = new ApplicationPrompts(requests, program, envConfig, prompts);
          applicationPrompts.handlePort();
        });

        after(() => {
          resetParams();
        });

        it('should add a prompt to ask for it', () => {
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

      describe('and the appPort has already been passed in', () => {
        let applicationPrompts;

        before(() => {
          requests.push('appPort');
          program.applicationPort = FAKE_APP_PORT;
          applicationPrompts = new ApplicationPrompts(requests, program, envConfig, prompts);
          applicationPrompts.handlePort();
        });

        after(() => {
          resetParams();
        });

        it('should not add any prompt', () => {
          expect(prompts).to.have.lengthOf(0);
        });

        it('should add the appPort to the configuration', () => {
          expect(envConfig.appPort).to.equal(FAKE_APP_PORT);
        });
      });
    });

    describe('When the appPort option is not requested', () => {
      const applicationPrompts = new ApplicationPrompts(requests, program, envConfig, prompts);

      it('should not do anything', () => {
        expect(envConfig.appPort).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        applicationPrompts.handlePort();

        expect(envConfig.appPort).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });
});

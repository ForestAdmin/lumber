const sinon = require('sinon');
const ApplicationPrompts = require('../../../services/prompter/application-prompts');

const FAKE_APP_HOST = 'fakeApplicationHost';
const FAKE_APP_PORT = '1234';

describe('services > prompter > application prompts', () => {
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

  describe('handling application related prompts', () => {
    let applicationPrompts;
    let hostnameHandlerStub;
    let portHandlerStub;

    it('should handle the host name', async () => {
      expect.assertions(1);
      applicationPrompts = new ApplicationPrompts(requests, envConfig, prompts, program);
      hostnameHandlerStub = sinon.stub(applicationPrompts, 'handleHostname');
      portHandlerStub = sinon.stub(applicationPrompts, 'handlePort');
      await applicationPrompts.handlePrompts();
      expect(hostnameHandlerStub.calledOnce).toStrictEqual(true);
    });

    it('should handle the port', () => {
      expect.assertions(1);
      expect(portHandlerStub.calledOnce).toStrictEqual(true);
      hostnameHandlerStub.restore();
      portHandlerStub.restore();
      resetParams();
    });
  });

  describe('handling host name', () => {
    describe('when the appHostname option is requested', () => {
      describe('and the appHostname has not been passed in', () => {
        it('should add a prompt to ask for it', () => {
          expect.assertions(1);
          requests.push('appHostname');
          const applicationPrompts = new ApplicationPrompts(requests, envConfig, prompts, program);
          applicationPrompts.handleHostname();
          expect(prompts).toHaveLength(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect.assertions(4);
          expect(prompts[0].type).toStrictEqual('input');
          expect(prompts[0].name).toStrictEqual('appHostname');
          expect(prompts[0].message).toStrictEqual('What\'s the IP/hostname on which your application will be running? ');
          expect(prompts[0].default).toStrictEqual('http://localhost');
        });

        it('should not change the configuration', () => {
          expect.assertions(1);
          expect(envConfig.appHostname).toBeUndefined();
          resetParams();
        });
      });

      describe('and the appHostname has already been passed in', () => {
        it('should not add any prompt', () => {
          expect.assertions(1);
          requests.push('appHostname');
          program.applicationHost = FAKE_APP_HOST;
          const applicationPrompts = new ApplicationPrompts(requests, envConfig, prompts, program);
          applicationPrompts.handleHostname();

          expect(prompts).toHaveLength(0);
        });

        it('should add the appHostname to the configuration', () => {
          expect.assertions(1);
          expect(envConfig.appHostname).toStrictEqual(FAKE_APP_HOST);
          resetParams();
        });
      });
    });

    describe('when the appHostname option is not requested', () => {
      it('should not do anything', () => {
        expect.assertions(5);
        program.applicationHost = 'Hostname';
        const applicationPrompts = new ApplicationPrompts(requests, envConfig, prompts, program);

        expect(envConfig.appHostname).toBeUndefined();
        expect(prompts).toHaveLength(0);

        applicationPrompts.handleHostname();

        expect(envConfig.appHostname).toBeUndefined();
        expect(envConfig.appHostname).not.toStrictEqual(program.applicationHost);
        expect(prompts).toHaveLength(0);
        resetParams();
      });
    });
  });

  describe('handling port', () => {
    describe('when the appPort option is requested', () => {
      describe('and the appPort has not been passed in', () => {
        it('should add a prompt to ask for it', () => {
          expect.assertions(1);
          requests.push('appPort');
          const applicationPrompts = new ApplicationPrompts(requests, envConfig, prompts, program);
          applicationPrompts.handlePort();

          expect(prompts).toHaveLength(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect.assertions(5);
          expect(prompts[0].type).toStrictEqual('input');
          expect(prompts[0].name).toStrictEqual('appPort');
          expect(prompts[0].message).toStrictEqual('What\'s the port on which your application will be running? ');
          expect(prompts[0].default).toStrictEqual('3310');
          expect(prompts[0].validate).toBeInstanceOf(Function);
        });

        it('should validate the port', () => {
          expect.assertions(3);
          expect(prompts[0].validate(FAKE_APP_PORT)).toStrictEqual(true);
          expect(prompts[0].validate('non number port')).toStrictEqual('The port must be a number.');
          expect(prompts[0].validate(70000)).toStrictEqual('This is not a valid port.');
        });

        it('should not change the configuration', () => {
          expect.assertions(1);
          expect(envConfig.appPort).toBeUndefined();
          resetParams();
        });
      });

      describe('and the appPort has already been passed in', () => {
        it('should not add any prompt', () => {
          expect.assertions(1);
          requests.push('appPort');
          program.applicationPort = FAKE_APP_PORT;
          const applicationPrompts = new ApplicationPrompts(requests, envConfig, prompts, program);
          applicationPrompts.handlePort();

          expect(prompts).toHaveLength(0);
        });

        it('should add the appPort to the configuration', () => {
          expect.assertions(1);
          expect(envConfig.appPort).toStrictEqual(FAKE_APP_PORT);
          resetParams();
        });
      });
    });

    describe('when the appPort option is not requested', () => {
      let applicationPrompts;

      it('should not do anything', () => {
        expect.assertions(5);
        program.applicationPort = FAKE_APP_PORT;
        applicationPrompts = new ApplicationPrompts(requests, envConfig, prompts, program);

        expect(envConfig.appPort).toBeUndefined();
        expect(prompts).toHaveLength(0);

        applicationPrompts.handlePort();

        expect(envConfig.appPort).toBeUndefined();
        expect(envConfig.appPort).not.toStrictEqual(FAKE_APP_PORT);
        expect(prompts).toHaveLength(0);
      });
    });
  });
});

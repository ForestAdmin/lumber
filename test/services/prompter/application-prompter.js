const { describe, it } = require('mocha');
const { expect } = require('chai');
const ApplicationPrompts = require('../../../services/prompter/application-prompts');

/*describe('Services > Prompter > Application prompts', () => {
  describe('Handling host name : ', () => {
    describe('When the appHostName option is requested', () => {
      const envConfig = {};
      const requests = ['appHostName'];
      const program = {};
      const prompts = [];

      describe('and the projectName has not been passed in', () => {
        const projectPrompts = new ProjectPrompts(undefined, envConfig, requests);

        it('should terminate the process with exit code 1', async () => {
          await projectPrompts.handleName();
        });
      });

      describe('and the projectName has already been passed in', () => {
        const projectPrompts = new ProjectPrompts(FAKE_PROJECT_NAME, envConfig, requests);

        describe('and the directory to write in is not available', async () => {
          before(() => {
            const mkdirAsync = P.promisify(mkdir);

            mkdirAsync.sync(`${process.cwd()}/${TEST_TMP_DIRECTORY}/${FAKE_PROJECT_NAME}`);
          });

          after(async () => {
            const rmdirAsync = P.promisify(rmdir);

            await rmdirAsync(`${process.cwd()}/${TEST_TMP_DIRECTORY}`);
          });

          it('should terminate the process with exit code 1', async () => {
            await projectPrompts.handleName();
          });

          it('should log an error in the console', async () => {
            // TODO HANDLE LOGGER
          });

          it('should send an event', async () => {
            // TODO HANDLE EVENT SENDING
          });
        });

        describe('and the directory to write in is available', async () => {
          await projectPrompts.handleName();

          it('should add the appName to the configuration', async () => {
            expect(envConfig.appName).to.equal(undefined);

            await projectPrompts.handleName();

            expect(envConfig.appName).to.equal(FAKE_PROJECT_NAME);
          });
        });
      });
    });

    describe('When the appHostName option is not requested', () => {
      const projectPrompts = new ApplicationPrompts(FAKE_PROJECT_NAME, envConfig, requests);

      it('should not do anything', async () => {
        expect(envConfig.appName).to.equal(undefined);

        await projectPrompts.handleName();

        expect(envConfig.appName).to.equal(undefined);
      });
    });
  });

  describe('Handling port : ', () => {
    describe('when the appName option is requested', () => {
      const envConfig = {};
      const requests = ['appName'];
      const exitFunction = process.exit;

      describe('and the projectName has not been passed in', () => {
        const projectPrompts = new ProjectPrompts(undefined, envConfig, requests);

        it('should terminate the process with exit code 1', async () => {
          await projectPrompts.handleName();
        });
      });

      describe('and the projectName has already been passed in', () => {
        const projectPrompts = new ProjectPrompts(FAKE_PROJECT_NAME, envConfig, requests);

        describe('and the directory to write in is not available', async () => {
          before(() => {
            const mkdirAsync = P.promisify(mkdir);

            mkdirAsync.sync(`${process.cwd()}/${TEST_TMP_DIRECTORY}/${FAKE_PROJECT_NAME}`);
          });

          after(async () => {
            const rmdirAsync = P.promisify(rmdir);

            await rmdirAsync(`${process.cwd()}/${TEST_TMP_DIRECTORY}`);
          });

          it('should terminate the process with exit code 1', async () => {
            await projectPrompts.handleName();
          });

          it('should log an error in the console', async () => {
            // TODO HANDLE LOGGER
          });

          it('should send an event', async () => {
            // TODO HANDLE EVENT SENDING
          });
        });

        describe('and the directory to write in is available', async () => {
          await projectPrompts.handleName();

          it('should add the appName to the configuration', async () => {
            expect(envConfig.appName).to.equal(undefined);

            await projectPrompts.handleName();

            expect(envConfig.appName).to.equal(FAKE_PROJECT_NAME);
          });
        });
      });
    });

    describe('when the appName option is not requested', () => {
      const envConfig = {};
      const requests = [];

      const projectPrompts = new ProjectPrompts(FAKE_PROJECT_NAME, envConfig, requests);

      it('should not do anything', async () => {
        expect(envConfig.appName).to.equal(undefined);

        await projectPrompts.handleName();

        expect(envConfig.appName).to.equal(undefined);
      });
    });
  });
});*/

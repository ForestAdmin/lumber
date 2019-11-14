const {
  describe,
  it,
  before,
  after,
} = require('mocha');
const { expect } = require('chai');
const chalk = require('chalk');
const rmdirSync = require('rmdir-sync');
const mkdir = require('mkdirp');
const sinon = require('sinon');
const messages = require('../../../utils/messages');
const ProjectPrompts = require('../../../services/prompter/project-prompts');

const FAKE_PROJECT_NAME = 'fakeProject';

describe('Services > Prompter > Project prompts', () => {
  let envConfig = {};
  let requests = [];
  let program = {
    args: [],
  };

  function resetParams() {
    envConfig = {};
    requests = [];
    program = {
      args: [],
    };
  }

  describe('Handling project related prompts', () => {
    let projectPrompts;
    let nameHandlerStub;

    before(async () => {
      program.args = [FAKE_PROJECT_NAME];
      projectPrompts = new ProjectPrompts(requests, envConfig, program);
      nameHandlerStub = sinon.stub(projectPrompts, 'handleName');
      await projectPrompts.handlePrompts();
    });

    after(() => {
      resetParams();
    });

    it('should handle the project name', () => {
      expect(nameHandlerStub.calledOnce).to.equal(true);
    });
  });

  describe('Handling project name prompt : ', () => {
    describe('when the appName option is requested', () => {
      before(() => {
        requests.push('appName');
      });

      describe('and the projectName has not been passed in', () => {
        let projectPrompts;

        before(() => {
          projectPrompts = new ProjectPrompts(requests, envConfig, program);
        });

        it('should throw a prompter error', async () => {
          try {
            await projectPrompts.handleName();
            expect.fail('An error should have been thrown');
          } catch (e) {
            expect(e.errorMessage).to.equal(messages.ERROR_MISSING_PROJECT_NAME);
            expect(e.logs).to.deep.equal([
              messages.ERROR_MISSING_PROJECT_NAME,
              messages.HINT_MISSING_PROJECT_NAME,
            ]);
          }
        });
      });

      describe('and the projectName has already been passed in', () => {
        let projectPrompts;

        before(() => {
          program.args = [FAKE_PROJECT_NAME];
          projectPrompts = new ProjectPrompts(requests, envConfig, program);
        });

        describe('and the directory to write in is not available', () => {
          before(() => {
            mkdir.sync(`${process.cwd()}/${FAKE_PROJECT_NAME}`);
          });

          after(() => {
            rmdirSync(`${process.cwd()}/${FAKE_PROJECT_NAME}`);
          });

          it('should throw a prompter error', async () => {
            try {
              await projectPrompts.handleName();
              expect.fail('An error should have been thrown');
            } catch (e) {
              const message = `The directory ${chalk.red(`${process.cwd()}/${program.args[0]}`)} already exists.`;

              expect(e.errorMessage).to.equal(message);
              expect(e.logs).to.deep.equal([
                message,
                messages.HINT_DIRECTORY_ALREADY_EXISTS,
              ]);
            }
          });
        });

        describe('and the directory to write in is available', () => {
          it('should add the appName to the configuration', async () => {
            expect(envConfig.appName).to.equal(undefined);

            await projectPrompts.handleName();

            expect(envConfig.appName).to.equal(FAKE_PROJECT_NAME);
          });
        });
      });
    });

    describe('when the appName option is not requested', () => {
      before(() => {
        resetParams();
      });

      it('should not do anything', async () => {
        program.args = [FAKE_PROJECT_NAME];
        const projectPrompts = new ProjectPrompts(requests, envConfig, program);

        expect(envConfig.appName).to.equal(undefined);

        await projectPrompts.handleName();

        expect(envConfig.appName).to.equal(undefined);
      });
    });
  });
});

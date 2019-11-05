const {
  describe,
  it,
  before,
  after,
  afterEach,
} = require('mocha');
const P = require('bluebird');
const { expect } = require('chai');
const chalk = require('chalk');
const rmdir = require('rmdir');
const mkdir = require('mkdirp');
const sinon = require('sinon');
const eventSender = require('../../../services/event-sender');
const logger = require('../../../services/logger');
const ProjectPrompts = require('../../../services/prompter/project-prompts');

const FAKE_PROJECT_NAME = 'fakeProject';

describe('Services > Prompter > Project prompts', () => {
  describe('Handling project name prompt : ', () => {
    describe('when the appName option is requested', () => {
      const envConfig = {};
      const requests = ['appName'];

      const loggerSpy = sinon.spy(logger, 'error');
      const eventSenderSpy = sinon.spy(eventSender, 'notifyError');

      before(() => {
        sinon.stub(process, 'exit');
      });

      afterEach(() => {
        loggerSpy.resetHistory();
        eventSenderSpy.resetHistory();
      });

      after(() => {
        process.exit.restore();
      });

      describe('and the projectName has not been passed in', () => {
        const projectPrompts = new ProjectPrompts(undefined, envConfig, requests);

        it('should terminate the process with exit code 1', async () => {
          await projectPrompts.handleName();

          expect(process.exit.calledOnce);
          expect(process.exit.calledWith(1));
        });

        it('should log an error message', async () => {
          const firstErrorMessage = 'Missing project name in the command.';
          const secondErrorMessage = 'Please specify a project name. Type lumber help for more information.';

          await projectPrompts.handleName();

          expect(loggerSpy.getCall(0).args[0]).to.equal(firstErrorMessage);
          expect(loggerSpy.getCall(0).args[1]).to.equal(secondErrorMessage);
        });
      });

      describe('and the projectName has already been passed in', () => {
        const projectPrompts = new ProjectPrompts(FAKE_PROJECT_NAME, envConfig, requests);

        describe('and the directory to write in is not available', async () => {
          before(() => {
            const mkdirAsync = P.promisify(mkdir);

            mkdirAsync.sync(`${process.cwd()}/${FAKE_PROJECT_NAME}`);
          });

          after(async () => {
            const rmdirAsync = P.promisify(rmdir);

            await rmdirAsync(`${process.cwd()}/${FAKE_PROJECT_NAME}`);
          });

          it('should terminate the process with exit code 1', async () => {
            await projectPrompts.handleName();

            expect(process.exit.calledOnce);
            expect(process.exit.calledWith(1));
          });

          it('should log an error in the console', async () => {
            const firstErrorMessage = `The directory ${chalk.red(`${process.cwd()}/${FAKE_PROJECT_NAME}`)} already exists.`;
            const secondErrorMessage = 'Please retry with another project name.';

            await projectPrompts.handleName();

            expect(loggerSpy.calledOnce);
            expect(loggerSpy.getCall(0).args[0]).to.equal(firstErrorMessage);
            expect(loggerSpy.getCall(0).args[1]).to.equal(secondErrorMessage);
          });

          it('should send an event', async () => {
            const firstArgument = 'unknown_error';
            const secondArgument = `The directory ${chalk.red(`${process.cwd()}/${FAKE_PROJECT_NAME}`)} already exists.`;

            await projectPrompts.handleName();

            expect(eventSenderSpy.calledOnce);
            expect(eventSenderSpy.getCall(0).args[0]).to.equal(firstArgument);
            expect(eventSenderSpy.getCall(0).args[1]).to.equal(secondArgument);
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
});

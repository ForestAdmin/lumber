const {
  describe,
  it,
  after,
  before,
} = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const GeneralPrompter = require('../../../services/prompter/general-prompter');
const PrompterError = require('../../../services/prompter/prompter-error');
const Terminator = require('../../../utils/terminator');

describe('Services > Prompter > General prompter', () => {
  let requests = [];
  let program = {};

  function resetParams() {
    requests = [];
    program = {};
  }

  describe('Getting the config from prompts', () => {
    describe('When a PromptError is thrown', () => {
      let generalPrompter;
      let userPromptsStub;
      let applicationPromptsStub;
      let projectPromptsStub;
      let databasePromptsStub;
      let terminateStub;

      before(() => {
        const promptError = new PrompterError('error message', ['logs']);

        generalPrompter = new GeneralPrompter(requests, program);
        userPromptsStub = sinon.stub(generalPrompter.userPrompt, 'handlePrompts').rejects(promptError);
        applicationPromptsStub = sinon.stub(generalPrompter.applicationPrompt, 'handlePrompts').rejects(promptError);
        projectPromptsStub = sinon.stub(generalPrompter.projectPrompt, 'handlePrompts').rejects(promptError);
        databasePromptsStub = sinon.stub(generalPrompter.databasePrompt, 'handlePrompts').rejects(promptError);
        terminateStub = sinon.stub(Terminator, 'terminate').resolves(true);
      });

      after(() => {
        resetParams();
        userPromptsStub.restore();
        applicationPromptsStub.restore();
        projectPromptsStub.restore();
        databasePromptsStub.restore();
        terminateStub.restore();
      });

      it('should terminate the process', async () => {
        await generalPrompter.getConfig();

        const status = terminateStub.getCall(0).args[0];
        const {
          errorCode,
          errorMessage,
          logs,
          context,
        } = terminateStub.getCall(0).args[1];

        expect(status).to.equal(1);
        expect(errorCode).to.equal('prompter_error');
        expect(errorMessage).to.equal('error message');
        expect(logs).to.deep.equal(['logs']);
        expect(context).to.equal(undefined);
      });
    });
  });
});

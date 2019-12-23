const sinon = require('sinon');
const GeneralPrompter = require('../../../services/prompter/general-prompter');
const PrompterError = require('../../../services/prompter/prompter-error');
const Terminator = require('../../../utils/terminator');

describe('services > prompter > general prompter', () => {
  let requests = [];
  let program = {};

  function resetParams() {
    requests = [];
    program = {};
  }

  describe('getting the config from prompts', () => {
    describe('when a PromptError is thrown', () => {
      it('should terminate the process', async () => {
        expect.assertions(5);
        const promptError = new PrompterError('error message', ['logs']);

        const generalPrompter = new GeneralPrompter(requests, program);
        const userPromptsStub = sinon.stub(generalPrompter.userPrompt, 'handlePrompts').rejects(promptError);
        const applicationPromptsStub = sinon.stub(generalPrompter.applicationPrompt, 'handlePrompts').rejects(promptError);
        const projectPromptsStub = sinon.stub(generalPrompter.projectPrompt, 'handlePrompts').rejects(promptError);
        const databasePromptsStub = sinon.stub(generalPrompter.databasePrompt, 'handlePrompts').rejects(promptError);
        const terminateStub = sinon.stub(Terminator, 'terminate').resolves(true);

        await generalPrompter.getConfig();

        const status = terminateStub.getCall(0).args[0];
        const {
          errorCode,
          errorMessage,
          logs,
          context,
        } = terminateStub.getCall(0).args[1];

        expect(status).toStrictEqual(1);
        expect(errorCode).toStrictEqual('unexpected_error');
        expect(errorMessage).toStrictEqual('error message');
        expect(logs).toStrictEqual(['logs']);
        expect(context).toBeUndefined();

        resetParams();
        userPromptsStub.restore();
        applicationPromptsStub.restore();
        projectPromptsStub.restore();
        databasePromptsStub.restore();
        terminateStub.restore();
      });
    });
  });
});

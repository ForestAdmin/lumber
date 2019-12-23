const AbstractPrompt = require('../../../services/prompter/abstract-prompter');

describe('services > prompter > prompt utils', () => {
  const promptUtils = new AbstractPrompt(['requestedOption']);

  describe('when checking if an option is requested', () => {
    it('should return true if the option is present in the requests', () => {
      expect.assertions(1);
      expect(promptUtils.isOptionRequested('requestedOption')).toStrictEqual(true);
    });

    it('should return false if the option is not present in the requests', () => {
      expect.assertions(1);
      expect(promptUtils.isOptionRequested('notRequestedOption')).toStrictEqual(false);
    });
  });
});

const { describe, it } = require('mocha');
const { expect } = require('chai');
const AbstractPrompt = require('../../../services/prompter/abstract-prompter');

describe('Services > Prompter > Prompt utils', () => {
  const promptUtils = new AbstractPrompt(['requestedOption']);

  describe('When checking if an option is requested', () => {
    it('should return true if the option is present in the requests', () => {
      expect(promptUtils.isOptionRequested('requestedOption')).to.equal(true);
    });

    it('should return false if the option is not present in the requests', () => {
      expect(promptUtils.isOptionRequested('notRequestedOption')).to.equal(false);
    });
  });
});

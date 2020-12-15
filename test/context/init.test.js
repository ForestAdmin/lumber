const initContext = require('../../context/init');
const ApplicationContext = require('../../context/application-context');

describe('context > init', () => {
  it('should not throw error with an empty context', () => {
    expect.assertions(1);

    initContext(new ApplicationContext());

    expect(() => initContext(new ApplicationContext())).not.toThrow();
  });

  it('should throw an error if the provided context already have a defined key', () => {
    expect.assertions(1);

    const ctxt = new ApplicationContext();
    ctxt.addInstance('logger', {});

    expect(() => initContext(ctxt)).toThrow("existing instance { key: 'logger'} in context");
  });
});

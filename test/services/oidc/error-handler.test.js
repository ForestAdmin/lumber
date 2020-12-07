const OidcError = require('../../../services/oidc/error');
const OidcErrorHandler = require('../../../services/oidc/error-handler');

describe('service > Oidc > OidcErrorHandler', () => {
  function setupTest() {
    const context = {
      terminator: {
        terminate: jest.fn(),
      },
      chalk: {
        red: jest.fn().mockImplementation((value) => `<red>${value}</red>`),
      },
      messages: {
        ERROR_UNEXPECTED: 'Unexpected',
      },
    };
    const errorHandler = new OidcErrorHandler(context);

    return {
      ...context,
      errorHandler,
    };
  }
  describe('handle', () => {
    describe('when the error is unknown', () => {
      it('should display a message indicating that the error is unknown', () => {
        expect.assertions(1);

        const { errorHandler, terminator } = setupTest();

        errorHandler.handle(new Error('The error'));

        expect(terminator.terminate).toHaveBeenCalledWith(
          1,
          { logs: ['Unexpected <red>The error</red>'] },
        );
      });
    });

    describe('when the error is known', () => {
      it('should output the reason if provided', () => {
        expect.assertions(1);

        const { errorHandler, terminator } = setupTest();

        errorHandler.handle(new OidcError('The error', new Error('The inner error')));

        expect(terminator.terminate).toHaveBeenCalledWith(
          1,
          { logs: ['<red>The error</red>: The inner error'] },
        );
      });

      it('should output the possible solution if provided', () => {
        expect.assertions(1);

        const { errorHandler, terminator } = setupTest();

        errorHandler.handle(new OidcError('The error', undefined, 'possible solution'));

        expect(terminator.terminate).toHaveBeenCalledWith(
          1,
          { logs: ['<red>The error</red>', 'possible solution'] },
        );
      });
    });
  });
});

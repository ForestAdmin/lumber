const ApplicationTokenService = require('../../services/application-token');
const UnableToCreateApplicationTokenError = require('../../utils/errors/application-token/unable-to-create-application-token-error');

const SESSION_TOKEN = 'SESSION-TOKEN';

describe('services > ApplicationToken', () => {
  function setup() {
    const os = {
      hostname: jest.fn(),
    };

    const api = {
      createApplicationToken: jest.fn(),
      deleteApplicationToken: jest.fn(),
    };

    const context = { api, os };

    const applicationTokenService = new ApplicationTokenService(context);

    return { ...context, applicationTokenService };
  }

  describe('generateApplicationToken', () => {
    it('should call the api to generate a new application token and return its value', async () => {
      expect.assertions(3);

      const { api, os, applicationTokenService } = setup();

      os.hostname.mockReturnValue('Machine name');
      api.createApplicationToken.mockReturnValue({ token: 'ABCDE' });

      const result = await applicationTokenService.generateApplicationToken(SESSION_TOKEN);

      expect(result).toStrictEqual('ABCDE');
      expect(os.hostname).toHaveBeenCalledWith();
      expect(api.createApplicationToken).toHaveBeenCalledWith({
        name: 'Lumber @Machine name',
      }, SESSION_TOKEN);
    });

    it('should throw an error if something goes wrong with the API', async () => {
      expect.assertions(1);

      const { api, os, applicationTokenService } = setup();

      os.hostname.mockReturnValue('Machine name');
      api.createApplicationToken.mockRejectedValue(new Error('Internal error'));

      await expect(applicationTokenService.generateApplicationToken(SESSION_TOKEN))
        .rejects.toBeInstanceOf(UnableToCreateApplicationTokenError);
    });
  });

  describe('deleteApplicationToken', () => {
    it('should call the api to delete the current token', async () => {
      expect.assertions(1);

      const { api, applicationTokenService } = setup();

      api.deleteApplicationToken.mockResolvedValue(undefined);

      await applicationTokenService.deleteApplicationToken('THE-TOKEN');

      expect(api.deleteApplicationToken).toHaveBeenCalledWith('THE-TOKEN');
    });

    it('should hide 404 errors, because it indicates that the token is a normal token', async () => {
      expect.assertions(1);

      const { api, applicationTokenService } = setup();

      api.deleteApplicationToken.mockRejectedValue({ status: 404 });

      await applicationTokenService.deleteApplicationToken('THE-TOKEN');

      expect(api.deleteApplicationToken).toHaveBeenCalledWith('THE-TOKEN');
    });

    it('should propagate non-404 errors', async () => {
      expect.assertions(1);

      const { api, applicationTokenService } = setup();

      const error = new Error('the error');
      api.deleteApplicationToken.mockRejectedValue(error);

      await expect(applicationTokenService.deleteApplicationToken('THE-TOKEN')).rejects.toBe(error);
    });
  });
});

const ApplicationTokenService = require('../../services/application-token');
const UnableToCreateApplicationTokenError = require('../../utils/errors/application-token/unable-to-create-application-token-error');

describe('services > ApplicationToken', () => {
  function setup() {
    const os = {
      hostname: jest.fn(),
    };

    const api = {
      createApplicationToken: jest.fn(),
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

      const result = await applicationTokenService.generateApplicationToken('SESSION-TOKEN');

      expect(result).toStrictEqual('ABCDE');
      expect(os.hostname).toHaveBeenCalledWith();
      expect(api.createApplicationToken).toHaveBeenCalledWith({
        name: 'Lumber @Machine name',
      }, 'SESSION-TOKEN');
    });

    it('should throw an error if something goes wrong with the API', async () => {
      expect.assertions(1);

      const { api, os, applicationTokenService } = setup();

      os.hostname.mockReturnValue('Machine name');
      api.createApplicationToken.mockRejectedValue(new Error('Internal error'));

      await expect(applicationTokenService.generateApplicationToken('SESSION-TOKEN'))
        .rejects.toBeInstanceOf(UnableToCreateApplicationTokenError);
    });
  });
});

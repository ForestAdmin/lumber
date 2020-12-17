const Authenticator = require('../../services/authenticator');

describe('services > Authenticator', () => {
  function setup() {
    const logger = {
      info: jest.fn(),
    };
    const fs = {};
    const os = {
      homedir: jest.fn().mockReturnValue('sweet-home'),
    };
    const chalk = {};
    const api = {};
    const terminator = {};
    const authenticatorHelper = {};
    const inquirer = {};
    const fsAsync = {
      stat: jest.fn(),
      readFile: jest.fn(),
      unlink: jest.fn(),
    };
    const applicationTokenService = {
      deleteApplicationToken: jest.fn(),
    };

    const context = {
      logger,
      fs,
      os,
      chalk,
      api,
      terminator,
      authenticatorHelper,
      inquirer,
      fsAsync,
      applicationTokenService,
      LUMBER_PATH: 'sweet-home/.lumberrc',
    };

    const authenticator = new Authenticator(context);

    return {
      authenticator,
      ...context,
    };
  }

  describe('logout', () => {
    describe('when the user is logged in', () => {
      it('should delete the lumberrc file and delete the application token', async () => {
        expect.assertions(4);
        const {
          fsAsync, authenticator, applicationTokenService, LUMBER_PATH,
        } = setup();

        fsAsync.stat.mockReturnValue(undefined);
        fsAsync.readFile.mockResolvedValue('TOKEN');
        applicationTokenService.deleteApplicationToken.mockResolvedValue(undefined);
        fsAsync.unlink.mockResolvedValue(undefined);

        await authenticator.logout();

        expect(fsAsync.stat).toHaveBeenCalledWith(LUMBER_PATH);
        expect(fsAsync.readFile).toHaveBeenCalledWith(LUMBER_PATH, { encoding: 'utf8' });
        expect(applicationTokenService.deleteApplicationToken).toHaveBeenCalledWith('TOKEN');
        expect(fsAsync.unlink).toHaveBeenCalledWith(LUMBER_PATH);
      });
    });

    describe('when the lumberrc file exists but is empty', () => {
      it('should delete the file without calling the API', async () => {
        expect.assertions(2);
        const {
          fsAsync, authenticator, applicationTokenService, LUMBER_PATH,
        } = setup();

        fsAsync.stat.mockReturnValue(undefined);
        fsAsync.readFile.mockResolvedValue('');
        fsAsync.unlink.mockResolvedValue(undefined);

        await authenticator.logout();

        expect(applicationTokenService.deleteApplicationToken).not.toHaveBeenCalled();
        expect(fsAsync.unlink).toHaveBeenCalledWith(LUMBER_PATH);
      });
    });

    describe('when the lumberrc file does not exist', () => {
      it('should write a message indicating that the user is not logged in', async () => {
        expect.assertions(3);
        const {
          fsAsync, authenticator, logger, LUMBER_PATH,
        } = setup();

        fsAsync.stat.mockRejectedValue({ code: 'ENOENT' });

        await authenticator.logout();

        expect(fsAsync.stat).toHaveBeenCalledWith(LUMBER_PATH);
        expect(logger.info).toHaveBeenCalledWith('You were not logged in');
        expect(fsAsync.readFile).not.toHaveBeenCalled();
      });
    });

    describe('when the api returned an error', () => {
      it('should delete the file as well', async () => {
        expect.assertions(2);
        const {
          fsAsync, authenticator, applicationTokenService, LUMBER_PATH,
        } = setup();

        fsAsync.stat.mockReturnValue(undefined);
        fsAsync.readFile.mockResolvedValue('TOKEN');
        const error = new Error('the error');
        applicationTokenService.deleteApplicationToken.mockRejectedValue(error);
        fsAsync.unlink.mockResolvedValue(undefined);

        await expect(authenticator.logout()).rejects.toBe(error);

        expect(fsAsync.unlink).toHaveBeenCalledWith(LUMBER_PATH);
      });
    });

    describe('when reading the file throws an error', () => {
      it('should propagate the error', async () => {
        expect.assertions(2);

        const { fsAsync, authenticator } = setup();

        const error = new Error('the error');
        fsAsync.stat.mockRejectedValue(error);

        await expect(authenticator.logout()).rejects.toBe(error);

        expect(fsAsync.unlink).not.toHaveBeenCalled();
      });
    });
  });
});

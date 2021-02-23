const OidcAuthenticator = require('../../../services/oidc/authenticator');
const OidcError = require('../../../services/oidc/error');

describe('services > Oidc > Authenticator', () => {
  describe('authenticate', () => {
    function setupTest() {
      const flow = {
        poll: jest.fn(),
        expired: jest.fn(),
        verification_uri: 'https://verification.forest',
        verification_uri_complete: 'https://verification.forest?user_code=ABCD',
        user_code: 'ABC',
        expires_in: 100,
      };

      const client = {
        deviceAuthorization: jest.fn(),
      };

      const issuer = {
        Client: {
          register: jest.fn(),
        },
      };

      const open = jest.fn();

      const context = {
        env: {
          FOREST_URL: 'https://forest.admin',
        },
        process: {
          stdout: {
            write: jest.fn(),
          },
        },
        openIdClient: {
          Issuer: {
            discover: jest.fn().mockReturnValue(issuer),
          },
        },
        open,
      };

      const authenticator = new OidcAuthenticator(context);
      return {
        ...context,
        authenticator,
        client,
        issuer,
        flow,
      };
    }

    it('should successfully authenticate the user', async () => {
      expect.assertions(7);
      const {
        authenticator, issuer, client, flow, openIdClient, process, open,
      } = setupTest();

      const tokenSet = {
        access_token: 'THE-TOKEN',
      };

      openIdClient.Issuer.discover.mockReturnValue(Promise.resolve(issuer));
      issuer.Client.register.mockReturnValue(Promise.resolve(client));
      client.deviceAuthorization.mockReturnValue(Promise.resolve(flow));
      flow.poll.mockReturnValue(Promise.resolve(tokenSet));

      const token = await authenticator.authenticate();

      expect(token).toBe('THE-TOKEN');
      expect(openIdClient.Issuer.discover).toHaveBeenCalledWith('https://forest.admin/oidc/.well-known/openid-configuration');
      expect(issuer.Client.register).toHaveBeenCalledWith({
        name: 'lumber',
        application_type: 'native',
        redirect_uris: ['com.forestadmin.lumber://authenticate'],
        token_endpoint_auth_method: 'none',
        grant_types: ['urn:ietf:params:oauth:grant-type:device_code'],
        response_types: ['none'],
      });
      expect(client.deviceAuthorization).toHaveBeenCalledWith({
        scopes: ['openid', 'email', 'profile'],
      });
      expect(process.stdout.write).toHaveBeenNthCalledWith(1, 'Click on "Log in" on the browser tab which opened automatically or open this link: https://verification.forest\n');
      expect(process.stdout.write).toHaveBeenNthCalledWith(2, 'Your confirmation code: ABC\n');
      expect(open).toHaveBeenCalledWith('https://verification.forest?user_code=ABCD');
    });

    it('should throw a specific error when the issuer discovery returned an error', async () => {
      expect.assertions(2);
      const {
        authenticator, openIdClient,
      } = setupTest();

      const error = new Error('The error');

      openIdClient.Issuer.discover.mockReturnValue(Promise.reject(error));

      const promise = authenticator.authenticate();

      await expect(promise).rejects.toBeInstanceOf(OidcError);
      await expect(promise).rejects.toMatchObject({
        reason: 'The error',
      });
    });

    it('should throw a specific error when the client registration returned an error', async () => {
      expect.assertions(2);
      const {
        authenticator, openIdClient,
        issuer,
      } = setupTest();

      const error = new Error('The error');

      openIdClient.Issuer.discover.mockReturnValue(Promise.resolve(issuer));
      issuer.Client.register.mockReturnValue(Promise.reject(error));

      const promise = authenticator.authenticate();

      await expect(promise).rejects.toBeInstanceOf(OidcError);
      await expect(promise).rejects.toMatchObject({
        reason: 'The error',
      });
    });

    it('should throw a specific error when the device authentication returned an error', async () => {
      expect.assertions(2);
      const {
        authenticator, openIdClient,
        issuer,
        client,
      } = setupTest();

      const error = new Error('The error');

      openIdClient.Issuer.discover.mockReturnValue(Promise.resolve(issuer));
      issuer.Client.register.mockReturnValue(Promise.resolve(client));
      client.deviceAuthorization.mockReturnValue(Promise.reject(error));

      const promise = authenticator.authenticate();

      await expect(promise).rejects.toBeInstanceOf(OidcError);
      await expect(promise).rejects.toMatchObject({
        reason: 'The error',
      });
    });

    it('should throw a specific error when the polling returned an error', async () => {
      expect.assertions(2);
      const {
        authenticator, openIdClient,
        issuer,
        client,
        flow,
      } = setupTest();

      const error = new Error('The error');

      openIdClient.Issuer.discover.mockReturnValue(Promise.resolve(issuer));
      issuer.Client.register.mockReturnValue(Promise.resolve(client));
      client.deviceAuthorization.mockReturnValue(Promise.resolve(flow));
      flow.poll.mockReturnValue(Promise.reject(error));
      flow.expired.mockReturnValue(false);

      const promise = authenticator.authenticate();

      await expect(promise).rejects.toBeInstanceOf(OidcError);
      await expect(promise).rejects.toMatchObject({
        reason: 'The error',
      });
    });

    it('should throw a specific error when the polling expired', async () => {
      expect.assertions(4);
      const {
        authenticator, openIdClient,
        issuer,
        client,
        flow,
      } = setupTest();

      const error = new Error('The error');

      openIdClient.Issuer.discover.mockReturnValue(Promise.resolve(issuer));
      issuer.Client.register.mockReturnValue(Promise.resolve(client));
      client.deviceAuthorization.mockReturnValue(Promise.resolve(flow));

      let reject;
      const flowPromise = new Promise((resolve, internalReject) => {
        reject = internalReject;
      });

      flow.poll.mockReturnValue(flowPromise);
      flow.expired.mockReturnValue(true);

      const promise = authenticator.authenticate();

      await new Promise((resolve) => setImmediate(resolve));

      flow.expires_in = 0;
      reject(error);

      await expect(promise).rejects.toBeInstanceOf(OidcError);
      await expect(promise).rejects.toMatchObject({
        possibleSolution: 'Please try to login a second time, and complete the authentication within 100 seconds',
      });
      await expect(promise).rejects.toHaveProperty('message', 'The authentication request expired');
      await expect(promise).rejects.toHaveProperty('reason', undefined);
    });
  });
});

const OidcError = require('./error');

class OidcAuthenticator {
  /**
   * @param {import('../../context/init').Context} context
   */
  constructor(context) {
    /** @private @readonly */
    this.openIdClient = context.openIdClient;
    /** @private @readonly */
    this.env = context.env;
    /** @private @readonly */
    this.process = context.process;
    /** @private @readonly */
    this.open = context.open;

    ['openIdClient', 'env', 'process', 'open'].forEach((name) => {
      if (!this[name]) throw new Error(`Missing dependency ${name}`);
    });
  }

  /**
   * @private
   * @returns {Promise<import('openid-client').Client>}
   */
  async register() {
    try {
      const issuer = await this.openIdClient.Issuer.discover(`${this.env.FOREST_URL}/oidc/.well-known/openid-configuration`);

      return await issuer.Client.register({
        name: 'lumber',
        application_type: 'native',
        redirect_uris: ['com.forestadmin.lumber://authenticate'],
        token_endpoint_auth_method: 'none',
        grant_types: ['urn:ietf:params:oauth:grant-type:device_code'],
        response_types: ['none'],
      });
    } catch (e) {
      throw new OidcError(
        'Unable to register against the Forest Admin server',
        e,
      );
    }
  }

  /**
   * @private
   * @param {import('openid-client').Client} client
   * @returns {Promise<import('openid-client').DeviceFlowHandle>}
   */
  static async launchDeviceAuthorization(client) {
    try {
      return await client.deviceAuthorization({
        scopes: ['openid', 'email', 'profile'],
      });
    } catch (e) {
      throw new OidcError(
        'Error while starting the authentication flow',
        e,
      );
    }
  }

  /**
   * @private
   * @param {import('openid-client').DeviceFlowHandle} flow
   * @returns {Promise<import('openid-client').TokenSet>}
   */
  async waitForAuthentication(flow) {
    const expiresIn = flow.expires_in;
    try {
      this.process.stdout.write(`Click on "Log in" on the browser tab which opened automatically or open this link: ${flow.verification_uri}\n`);
      this.process.stdout.write(`Your confirmation code: ${flow.user_code}\n`);

      await this.open(flow.verification_uri_complete);

      return await flow.poll();
    } catch (e) {
      if (flow.expired()) {
        throw new OidcError(
          'The authentication request expired',
          undefined,
          `Please try to login a second time, and complete the authentication within ${expiresIn} seconds`,
        );
      }

      throw new OidcError(
        'Error during the authentication',
        e,
      );
    }
  }

  /**
   * @returns {Promise<string>}
   */
  async authenticate() {
    const client = await this.register();

    const flow = await OidcAuthenticator.launchDeviceAuthorization(client);

    const tokenSet = await this.waitForAuthentication(flow);

    return tokenSet.access_token;
  }
}

module.exports = OidcAuthenticator;

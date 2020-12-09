const Api = require('../../services/api');

describe('services > API', () => {
  describe('createApplicationToken', () => {
    function setup() {
      const superagent = {
        post: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      const applicationTokenSerializer = {
        serialize: jest.fn(),
      };

      const applicationTokenDeserializer = {
        deserialize: jest.fn(),
      };

      const env = {
        FOREST_URL: 'https://api.test.forestadmin.com',
      };

      const pkg = {
        version: '1.2.3',
      };

      const context = {
        superagent,
        applicationTokenDeserializer,
        applicationTokenSerializer,
        env,
        pkg,
      };

      const api = new Api(context);

      return { ...context, api };
    }

    it('should send a query with the serialized token', async () => {
      expect.assertions(9);

      const {
        superagent, api, applicationTokenSerializer, applicationTokenDeserializer,
      } = setup();

      const serializedToken = {
        data: {
          attributes: {
            name: 'the token',
          },
        },
      };

      applicationTokenSerializer.serialize.mockReturnValue(serializedToken);

      const serializedResponseToken = {
        data: {
          id: '42',
          type: 'application-tokens',
          attributes: {
            name: 'the token',
            token: 'APPLICATION-TOKEN',
          },
        },
      };

      superagent.send.mockResolvedValue({ body: serializedResponseToken });

      const deserializedToken = {
        token: 'APPLICATION-TOKEN',
      };

      applicationTokenDeserializer.deserialize.mockResolvedValue(deserializedToken);

      const result = await api.createApplicationToken({ name: 'the token' }, 'SESSION');

      expect(result).toBe(deserializedToken);
      expect(superagent.post).toHaveBeenCalledWith('https://api.test.forestadmin.com/api/application-tokens');
      expect(superagent.set).toHaveBeenCalledWith('forest-origin', 'Lumber');
      expect(superagent.set).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(superagent.set).toHaveBeenCalledWith('User-Agent', 'lumber@1.2.3');
      expect(superagent.set).toHaveBeenCalledWith('Authorization', 'Bearer SESSION');
      expect(superagent.send).toHaveBeenCalledWith(serializedToken);
      expect(applicationTokenSerializer.serialize)
        .toHaveBeenCalledWith({ name: 'the token' });
      expect(applicationTokenDeserializer.deserialize)
        .toHaveBeenCalledWith(serializedResponseToken);
    });
  });
});

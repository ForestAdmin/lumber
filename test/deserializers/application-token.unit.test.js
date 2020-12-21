const applicationTokenDeserializer = require('../../deserializers/application-token');

describe('deserializers > ApplicationToken', () => {
  it('should deserialize the name and token of an application token', async () => {
    expect.assertions(1);

    const deserialized = await applicationTokenDeserializer.deserialize({
      data: {
        id: '42',
        type: 'application-tokens',
        attributes: {
          name: 'the token',
          token: 'ABC',
        },
      },
    });

    expect(deserialized).toStrictEqual({
      id: '42',
      name: 'the token',
      token: 'ABC',
    });
  });
});

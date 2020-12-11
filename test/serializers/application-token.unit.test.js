const applicationTokenSerializer = require('../../serializers/application-token');

describe('serializers > ApplicationToken', () => {
  it('should serialize the name of an application token', () => {
    expect.assertions(1);

    const serialized = applicationTokenSerializer.serialize({ name: 'the token' });

    expect(serialized).toStrictEqual({
      data: {
        type: 'application-tokens',
        attributes: {
          name: 'the token',
        },
      },
    });
  });
});

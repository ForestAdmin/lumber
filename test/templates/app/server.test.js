const fs = require('fs');

describe('templates > app/server.txt', () => {
  it('should use the PORT before the APPLICATION_PORT to be sure that the Heroku deployment works well', () => {
    expect.assertions(1);
    const template = fs.readFileSync('templates/app/server.txt').toString();
    expect(template).toStrictEqual(expect.stringMatching("process.env.PORT || process.env.APPLICATION_PORT || '3310'"));
  });
});

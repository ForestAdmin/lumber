const fs = require('fs');
const { expect } = require('chai');

describe('Templates > app/server.txt', () => {
  it('should use the PORT before the APPLICATION_PORT to be sure that the Heroku deployment works well', () => {
    const template = fs.readFileSync('templates/app/server.txt').toString();
    expect(template).to.contain("process.env.PORT || process.env.APPLICATION_PORT || '3310'");
  });
});

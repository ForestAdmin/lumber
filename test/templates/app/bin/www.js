/* global describe, it */
const fs = require('fs');
const { expect } = require('chai');

describe('Templates > app/bin/www', () => {
  it('should use the PORT before the APPLICATION_PORT to be sure that the Heroku deployment works well', () => {
    const template = fs.readFileSync('templates/app/bin/www').toString();
    expect(template).to.contain("process.env.PORT || process.env.APPLICATION_PORT || '3000'");
  });
});

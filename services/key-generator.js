const P = require('bluebird');
const crypto = require('crypto');

const randomBytes = P.promisify(crypto.randomBytes);

function KeyGenerator() {
  this.generate = () => randomBytes(48).then((buffer) => buffer.toString('hex'));
}

module.exports = KeyGenerator;

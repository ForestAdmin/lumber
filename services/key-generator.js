'use strict';
var P = require('bluebird');
var crypto = require('crypto');
var randomBytes = P.promisify(crypto.randomBytes);

function KeyGenerator() {
  this.generate = function () {
    return randomBytes(48)
      .then((buffer) => buffer.toString('hex'));
  };
}

module.exports = KeyGenerator;

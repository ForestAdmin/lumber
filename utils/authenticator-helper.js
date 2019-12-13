const atob = require('atob');
const logger = require('../services/logger');

function parseJwt(token) {
  if (!token || !token.includes('.')) { return null; }
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('Your session token is invalid.');
    return null;
  }
}

module.exports = {
  parseJwt,
};

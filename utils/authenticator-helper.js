const atob = require('atob');

function parseJwt(token) {
  if (!token || !token.includes('.')) { return null; }
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64)
      .split('')
      .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Session token parsing unexpected error:', error);
    return null;
  }
}

module.exports = {
  parseJwt,
};

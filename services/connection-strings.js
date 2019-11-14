const { ConnectionStringError } = require('../utils/errors');

const HOSTS_RX = /(.*?):\/\/(?: (?:[^:]*) (?: : ([^@]*) )? @ )?([^/?]*)(?:\/|)(.*)/;

const encodeConnectionString = (uri) => {
  const cap = uri.match(HOSTS_RX);
  if (!cap) {
    throw new ConnectionStringError.InvalidConnectionString('Can\'t parse connection string');
  }
  const [, protocol, , userPasswordHostPort, dbQuery] = cap;

  if (dbQuery.split('?')[0].indexOf('@') !== -1) {
    throw new ConnectionStringError.InvalidConnectionString('Unescaped \'/\' slash in user/host or db/query section');
  }

  const authorityParts = userPasswordHostPort.split('@');
  if (authorityParts.length > 2) {
    throw new ConnectionStringError.InvalidConnectionString('Unescaped \'@\' in user/host section');
  }

  const auth = {};
  if (authorityParts.length > 1) {
    const authParts = authorityParts.shift().split(':');
    if (authParts.length > 2) {
      throw new ConnectionStringError.InvalidConnectionString('Unescaped \':\' in user/host section');
    }
    auth.username = encodeURIComponent(authParts[0]);
    auth.password = encodeURIComponent(authParts[1] || null);
  }

  const hostPort = authorityParts.shift();
  return `${protocol}://${auth.username ? `${auth.username}${(auth.password ? `:${auth.password}@` : '')}` : ''}${hostPort}${dbQuery ? `/${dbQuery}` : ''}`;
};

module.exports = { encodeConnectionString };

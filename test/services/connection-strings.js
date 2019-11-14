const { expect } = require('chai');

const { ConnectionStringError } = require('../../utils/errors');

const {
  encodeConnectionString,
} = require('../../services/connection-strings');

describe('Connection Strings', () => {
  it('should return unchanged connection string', () => {
    const inputs = [
      'mongodb://localhost:27017',
      'mongodb://forest:secret@localhost:27017/requests?authSource=admin',
      'mongodb://forest:secret@localhost:27017/dimdime?authSource=admin',
      'mssql://azureuser:forest2019@mysqlserver1989.database.windows.net:1433/mssql-test-nov',
    ];
    inputs.forEach(input => expect(encodeConnectionString(input)).to.equals(input));
  });

  it('should return a connection string with encoded username and password', () => {
    const input = 'mongodb://supe&ru=ser:=superpass&word@localhost:27017/base?dd=ee';
    const expected = 'mongodb://supe%26ru%3Dser:%3Dsuperpass%26word@localhost:27017/base?dd=ee';
    expect(encodeConnectionString(input)).to.equals(expected);
  });

  it('should throw "Can\'t parse connection string"', () => {
    const input = 'bad_uri';
    const malformedInputEncoding = () => {
      encodeConnectionString(input);
    };
    expect(malformedInputEncoding).to.throw(ConnectionStringError.InvalidConnectionString, 'Can\'t parse connection string');
  });

  it('should throw "Unescaped \'@\' in authority section"', () => {
    const input = 'mongodb://supe@ruser:superpass@word@localhost:27017/base?dd=ee';
    const malformedInputEncoding = () => {
      encodeConnectionString(input);
    };
    expect(malformedInputEncoding).to.throw(ConnectionStringError.InvalidConnectionString, 'Unescaped \'@\' in user/host section');
  });

  it('should throw "InvalidConnectionString: Unescaped \':\' in authority section"', () => {
    const input = 'mongodb://supe:ruser:superpass:word@localhost:27017/base?dd=ee';
    const malformedInputEncoding = () => {
      encodeConnectionString(input);
    };
    expect(malformedInputEncoding).to.throw(ConnectionStringError.InvalidConnectionString, 'Unescaped \':\' in user/host section');
  });

  it('should return unchanged connection string with "/"', () => {
    const input = 'mongodb://supe:ruser:supe/rpass:word@localhost:27017/base?dd=ee';
    const malformedInputEncoding = () => {
      encodeConnectionString(input);
    };
    expect(malformedInputEncoding).to.throw(ConnectionStringError.InvalidConnectionString, 'Unescaped \'/\' slash in user/host or db/query section');
  });
});

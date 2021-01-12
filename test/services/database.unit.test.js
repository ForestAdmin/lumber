const Database = require('../../services/database');

const setupDatabase = ({ Sequelize = {}, mongodb = {}, terminator = {} } = {}) =>
  new Database({
    Sequelize,
    mongodb,
    terminator,
  });

describe('services > database', () => {
  describe('handleAuthenticationError', () => {
    it('should call terminate with the correct arguments', async () => {
      expect.assertions(2);

      const terminatorMock = { terminate: jest.fn() };
      const database = setupDatabase({ terminator: terminatorMock });

      const error = new Error('an error message');
      await database.handleAuthenticationError(error);

      expect(terminatorMock.terminate).toHaveBeenCalledTimes(1);
      expect(terminatorMock.terminate).toHaveBeenCalledWith(1, {
        logs: [
          'Cannot connect to the database due to the following error:',
          error,
        ],
        errorCode: 'database_authentication_error',
        errorMessage: error.message,
      });
    });
  });

  describe('sequelizeAuthenticate', () => {
    it('should call authenticate on the given connection', async () => {
      expect.assertions(1);

      const connectionMock = {
        authenticate: jest.fn().mockReturnValue(Promise.resolve()),
      };
      const database = setupDatabase();

      await database.sequelizeAuthenticate(connectionMock);

      expect(connectionMock.authenticate).toHaveBeenCalledTimes(1);
    });

    it('should return the connection on a successful authentication', async () => {
      expect.assertions(1);

      const connectionMock = {
        authenticate: jest.fn().mockReturnValue(Promise.resolve()),
      };
      const database = setupDatabase();

      const sequelizeAuthenticationResult = await database.sequelizeAuthenticate(connectionMock);

      expect(sequelizeAuthenticationResult).toStrictEqual(connectionMock);
    });

    it('should call handleAuthenticationError on a failed authentication', async () => {
      expect.assertions(2);

      const authenticationError = new Error('authentication error');
      const connectionMock = {
        authenticate: jest.fn().mockReturnValue(Promise.reject(authenticationError)),
      };
      const database = setupDatabase();
      const handleAuthenticationErrorSpy = jest
        .spyOn(database, 'handleAuthenticationError')
        .mockImplementation(jest.fn);

      await database.sequelizeAuthenticate(connectionMock);

      expect(handleAuthenticationErrorSpy).toHaveBeenCalledTimes(1);
      expect(handleAuthenticationErrorSpy).toHaveBeenCalledWith(authenticationError);
    });
  });

  describe('getDialect', () => {
    const database = setupDatabase();

    describe('when no connectionUrl is provided', () => {
      describe('and a dialect is provided', () => {
        it('should return the given dialect', () => {
          expect.assertions(1);
          expect(database.getDialect(null, 'something')).toStrictEqual('something');
        });
      });

      describe('and no dialect is provided', () => {
        it('should return undefined', () => {
          expect.assertions(1);
          expect(database.getDialect()).toBeUndefined();
        });
      });
    });

    describe('when connectionUrl is provided', () => {
      it('should return postgres when connection url starts with postgres://', () => {
        expect.assertions(1);
        expect(database.getDialect('postgres://user:passwd@somewhere/db')).toStrictEqual('postgres');
      });

      it('should return mysql when connection url starts with mysql://', () => {
        expect.assertions(1);
        expect(database.getDialect('mysql://user:passwd@somewhere/db')).toStrictEqual('mysql');
      });

      it('should return mssql when connection url starts with mssql://', () => {
        expect.assertions(1);
        expect(database.getDialect('mssql://user:passwd@somewhere/db')).toStrictEqual('mssql');
      });

      it('should return mongodb when connection url starts with mongodb', () => {
        expect.assertions(1);
        expect(database.getDialect('mongodb://user:passwd@somewhere/db')).toStrictEqual('mongodb');
      });
    });
  });

  describe('connectToMongodb', () => {
    describe('with an options parameter', () => {
      const context = {
        mongodb: {
          MongoClient: {
            connect: jest.fn().mockReturnValue(
              Promise.resolve({
                db: jest.fn(),
              }),
            ),
          },
        },
      };

      describe('when connectionUrl is not provided', () => {
        it('should build the connection URL and call mongodb connect', async () => {
          expect.assertions(1);

          const database = setupDatabase(context);

          const options = {
            dbUser: 'forest',
            dbPassword: 'forest',
            dbPort: '27017',
            dbHostname: 'mongodbhost',
            dbName: 'mydatabase',
          };
          await database.connectToMongodb(options);

          expect(context.mongodb.MongoClient.connect).toHaveBeenCalledWith(
            'mongodb://forest:forest@mongodbhost:27017/mydatabase',
            {
              useNewUrlParser: true,
              useUnifiedTopology: true,
            },
          );
        });

        it('should add +srv and handle ssl parameter', async () => {
          expect.assertions(1);

          const database = setupDatabase(context);

          const options = {
            mongodbSrv: true,
            dbUser: 'forest',
            dbPassword: 'forest',
            dbHostname: 'mongodbhost',
            dbName: 'mydatabase',
          };
          await database.connectToMongodb(options, true);

          expect(context.mongodb.MongoClient.connect).toHaveBeenCalledWith(
            'mongodb+srv://forest:forest@mongodbhost/mydatabase',
            {
              ssl: true,
              useNewUrlParser: true,
              useUnifiedTopology: true,
            },
          );
        });
      });

      describe('when a connectionUrl is provided', () => {
        it('should call mongodb connect with the specified url', async () => {
          expect.assertions(1);

          const database = setupDatabase(context);

          const options = {
            dbConnectionUrl: 'mongodb://forest:forest@mongodbhost:27018/anotherdatabase',
          };
          await database.connectToMongodb(options);

          expect(context.mongodb.MongoClient.connect).toHaveBeenCalledWith(
            'mongodb://forest:forest@mongodbhost:27018/anotherdatabase',
            {
              useNewUrlParser: true,
              useUnifiedTopology: true,
            },
          );
        });
      });
    });

    it('should call mongodb db function on successful connection', async () => {
      expect.assertions(2);

      const mongoDbMock = {
        db: jest.fn(),
      };
      const context = {
        mongodb: {
          MongoClient: {
            connect: jest.fn().mockReturnValue(
              Promise.resolve(mongoDbMock),
            ),
          },
        },
      };
      const database = setupDatabase(context);

      await database.connectToMongodb({ dbName: 'fake' });

      expect(mongoDbMock.db).toHaveBeenCalledTimes(1);
      expect(mongoDbMock.db).toHaveBeenCalledWith('fake');
    });

    it('should call handleAuthenticationError on a failed connection', async () => {
      expect.assertions(2);

      const connectError = new Error('connection error');
      const context = {
        mongodb: {
          MongoClient: {
            connect: jest.fn().mockReturnValue(Promise.reject(connectError)),
          },
        },
      };
      const database = setupDatabase(context);
      const handleAuthenticationErrorSpy = jest
        .spyOn(database, 'handleAuthenticationError')
        .mockImplementation(jest.fn);

      await database.connectToMongodb({});

      expect(handleAuthenticationErrorSpy).toHaveBeenCalledTimes(1);
      expect(handleAuthenticationErrorSpy).toHaveBeenCalledWith(connectError);
    });
  });

  describe('connect', () => {
    describe('using a mongodb database options', () => {
      it('should call the connectToMongodb function', async () => {
        expect.assertions(1);

        const database = setupDatabase();
        const connectToMongodbSpy = jest
          .spyOn(database, 'connectToMongodb')
          .mockImplementation();

        const options = { dbDialect: 'mongodb' };
        await database.connect(options);

        expect(connectToMongodbSpy).toHaveBeenCalledWith(options, undefined);
      });
    });

    describe('using a sql database options', () => {
      it('should call the sequelizeAuthenticate function', async () => {
        expect.assertions(2);

        const connection = jest.fn();
        const database = setupDatabase({
          Sequelize: jest.fn().mockReturnValue(connection),
        });
        const sequelizeAuthenticateMock = jest
          .spyOn(database, 'sequelizeAuthenticate')
          .mockImplementation();

        const options = { dbDialect: 'mysql' };
        await database.connect(options);

        expect(sequelizeAuthenticateMock).toHaveBeenCalledTimes(1);
        expect(sequelizeAuthenticateMock).toHaveBeenCalledWith(connection);
      });

      describe('when no connectionUrl is provided', () => {
        it('should compute the options and create a new Sequelize connection with it', async () => {
          expect.assertions(2);

          const SequelizeMock = jest.fn();
          const database = setupDatabase({
            Sequelize: SequelizeMock,
          });
          jest
            .spyOn(database, 'sequelizeAuthenticate')
            .mockImplementation();

          const options = {
            dbDialect: 'mysql',
            dbName: 'forest',
            dbHostname: 'mydatabasehost',
            dbPort: '3306',
            dbUser: 'user',
            dbPassword: 'password',
          };
          await database.connect(options);

          expect(SequelizeMock).toHaveBeenCalledTimes(1);
          expect(SequelizeMock).toHaveBeenCalledWith(
            options.dbName,
            options.dbUser,
            options.dbPassword,
            {
              dialect: 'mysql',
              host: 'mydatabasehost',
              logging: false,
              port: '3306',
            },
          );
        });
      });

      describe('when connectionUrl is provided', () => {
        it('should create a new sequelize connection using the given connectionUrl', async () => {
          expect.assertions(2);

          const SequelizeMock = jest.fn();
          const database = setupDatabase({
            Sequelize: SequelizeMock,
          });
          jest
            .spyOn(database, 'sequelizeAuthenticate')
            .mockImplementation();

          const options = {
            dbDialect: 'mysql',
            dbConnectionUrl: 'mysql://user:password@forest:3306/mydb',
          };

          await database.connect(options);

          expect(SequelizeMock).toHaveBeenCalledTimes(1);
          expect(SequelizeMock).toHaveBeenCalledWith(
            options.dbConnectionUrl,
            { logging: false },
          );
        });
      });
    });
  });

  describe('connectFromDatabasesConfig', () => {
    const database = setupDatabase();
    const connectSpy = jest.spyOn(database, 'connect').mockImplementation(({ dbConnectionUrl }) => ({
      url: dbConnectionUrl,
    }));

    const databaseUrl1 = 'mysql://user:password@forest:3306/db';
    const databaseConfig1 = {
      connection: {
        url: databaseUrl1,
        options: {},
      },
    };
    const databaseUrl2 = 'postgres://user:password@forest:3323/mydb';
    const databaseConfig2 = {
      connection: {
        url: databaseUrl2,
        options: {},
      },
    };
    const databasesConfig = [databaseConfig1, databaseConfig2];

    it('should call the connect function with the right parameters', async () => {
      expect.assertions(3);

      await database.connectFromDatabasesConfig(databasesConfig);

      expect(connectSpy).toHaveBeenCalledTimes(2);
      expect(connectSpy).toHaveBeenCalledWith({
        dbConnectionUrl: databaseUrl1,
        connectionOptions: {},
      });
      expect(connectSpy).toHaveBeenCalledWith({
        dbConnectionUrl: databaseUrl2,
        connectionOptions: {},
      });
    });

    it('should return databases config and connections instances', async () => {
      expect.assertions(1);

      const databasesConnections = await database.connectFromDatabasesConfig(databasesConfig);

      expect(databasesConnections).toStrictEqual([{
        ...databaseConfig1,
        connectionInstance: { url: databaseUrl1 },
      }, {
        ...databaseConfig2,
        connectionInstance: { url: databaseUrl2 },
      }]);
    });
  });

  describe('areAllDatabasesOfTheSameType', () => {
    it('should return true if databases are of the same type', () => {
      expect.assertions(1);

      const database = setupDatabase();
      const databasesConfig = [{
        connection: {
          url: 'mysql://user:password@forest:3306/db',
        },
      }, {
        connection: {
          url: 'postgres://user:password@forest:3323/mydb',
        },
      }];

      expect(database.areAllDatabasesOfTheSameType(databasesConfig)).toStrictEqual(true);
    });

    it('should return false if databases are not of the same type', () => {
      expect.assertions(1);

      const database = setupDatabase();
      const databasesConfig = [{
        connection: {
          url: 'mysql://user:password@forest:3306/mydb',
        },
      }, {
        connection: {
          url: 'mongodb://user:password@forest:27017/mydb',
        },
      }];

      expect(database.areAllDatabasesOfTheSameType(databasesConfig)).toStrictEqual(false);
    });
  });
});

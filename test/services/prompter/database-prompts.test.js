const sinon = require('sinon');
const PrompterError = require('../../../services/prompter/prompter-error');
const DatabasePrompts = require('../../../services/prompter/database-prompts');
const messages = require('../../../utils/messages');

const CONNECTION_URL_POSTGRES = 'postgres://username:password@host:port/database';

describe('services > prompter > database prompts', () => {
  let envConfig = {};
  let requests = [];
  let program = {};
  let prompts = [];

  function resetParams() {
    envConfig = {};
    requests = [];
    program = {};
    prompts = [];
  }

  describe('handling database related prompts', () => {
    let databasePrompts;
    let connectionUrlHandlerStub;
    let dialectHandlerStub;
    let nameHandlerStub;
    let schemaHandlerStub;
    let hostNameHandlerStub;
    let portHandlerStub;
    let userHandlerStub;
    let passwordHandlerStub;
    let sslHandlerStub;
    let mongoSrvHandlerStub;

    // eslint-disable-next-line jest/no-hooks
    beforeAll(async () => {
      databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
      connectionUrlHandlerStub = sinon.stub(databasePrompts, 'handleConnectionUrl');
      dialectHandlerStub = sinon.stub(databasePrompts, 'handleDialect');
      nameHandlerStub = sinon.stub(databasePrompts, 'handleName');
      schemaHandlerStub = sinon.stub(databasePrompts, 'handleSchema');
      hostNameHandlerStub = sinon.stub(databasePrompts, 'handleHostname');
      portHandlerStub = sinon.stub(databasePrompts, 'handlePort');
      userHandlerStub = sinon.stub(databasePrompts, 'handleUser');
      passwordHandlerStub = sinon.stub(databasePrompts, 'handlePassword');
      sslHandlerStub = sinon.stub(databasePrompts, 'handleSsl');
      mongoSrvHandlerStub = sinon.stub(databasePrompts, 'handleMongodbSrv');
      await databasePrompts.handlePrompts();
    });

    // eslint-disable-next-line jest/no-hooks
    afterAll(() => {
      connectionUrlHandlerStub.restore();
      dialectHandlerStub.restore();
      nameHandlerStub.restore();
      schemaHandlerStub.restore();
      hostNameHandlerStub.restore();
      portHandlerStub.restore();
      userHandlerStub.restore();
      passwordHandlerStub.restore();
      sslHandlerStub.restore();
      mongoSrvHandlerStub.restore();
      resetParams();
    });

    it('should handle the connection url', () => {
      expect.assertions(1);
      expect(connectionUrlHandlerStub.calledOnce).toStrictEqual(true);
    });

    it('should handle the dialect', () => {
      expect.assertions(1);
      expect(dialectHandlerStub.calledOnce).toStrictEqual(true);
    });

    it('should handle the name', () => {
      expect.assertions(1);
      expect(nameHandlerStub.calledOnce).toStrictEqual(true);
    });

    it('should handle the schema', () => {
      expect.assertions(1);
      expect(schemaHandlerStub.calledOnce).toStrictEqual(true);
    });

    it('should handle the port', () => {
      expect.assertions(1);
      expect(portHandlerStub.calledOnce).toStrictEqual(true);
    });

    it('should handle the user', () => {
      expect.assertions(1);
      expect(userHandlerStub.calledOnce).toStrictEqual(true);
    });

    it('should handle the password', () => {
      expect.assertions(1);
      expect(passwordHandlerStub.calledOnce).toStrictEqual(true);
    });

    it('should handle ssl usage', () => {
      expect.assertions(1);
      expect(sslHandlerStub.calledOnce).toStrictEqual(true);
    });

    it('should handle mongodb srv usage', () => {
      expect.assertions(1);
      expect(mongoSrvHandlerStub.calledOnce).toStrictEqual(true);
    });
  });

  describe('handling connection url', () => {
    describe('when the dbConnectionUrl option is requested', () => {
      describe('and the dbConnectionUrl has already been passed in', () => {
        describe('and the dbConnectionUrl is valid', () => {
          it('should add the dbConnectionUrl to the configuration', async () => {
            expect.assertions(1);
            requests.push('dbConnectionUrl');
            program.connectionUrl = CONNECTION_URL_POSTGRES;

            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

            await databasePrompts.handleConnectionUrl();

            expect(envConfig.dbConnectionUrl).toStrictEqual(CONNECTION_URL_POSTGRES);
            resetParams();
          });

          it('should add the dbDialect to configuration', async () => {
            expect.assertions(1);
            requests.push('dbConnectionUrl');
            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

            program.connectionUrl = CONNECTION_URL_POSTGRES;

            await databasePrompts.handleConnectionUrl();

            expect(envConfig.dbDialect).toStrictEqual('postgres');
            resetParams();
          });

          it('should add the mongo dbDialect to configuration when using mongo+srv', async () => {
            expect.assertions(1);
            requests.push('dbConnectionUrl');
            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

            program.connectionUrl = 'mongodb+srv://username:password@host1:port1/database';

            await databasePrompts.handleConnectionUrl();

            expect(envConfig.dbDialect).toStrictEqual('mongodb');
            resetParams();
          });
        });

        describe('and the dbConnectionUrl is invalid', () => {
          it('should throw a prompter error', async () => {
            expect.assertions(2);
            requests.push('dbConnectionUrl');
            program.connectionUrl = 'invalid';
            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
            await expect(databasePrompts.handleConnectionUrl()).rejects.toThrow(PrompterError);
            await expect(databasePrompts.handleConnectionUrl()).rejects
              .toThrow(messages.ERROR_NOT_PARSABLE_CONNECTION_URL);
            resetParams();
          });
        });
      });
    });

    describe('when the dbConnectionUrl option is not requested', () => {
      it('should not prompt for database connection url', async () => {
        expect.assertions(5);
        program.connectionUrl = CONNECTION_URL_POSTGRES;
        const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        expect(envConfig.dbConnectionUrl).toBeUndefined();
        expect(prompts).toHaveLength(0);

        await databasePrompts.handleConnectionUrl();

        expect(envConfig.dbConnectionUrl).toBeUndefined();
        expect(envConfig.dbConnectionUrl).not.toStrictEqual(CONNECTION_URL_POSTGRES);
        expect(prompts).toHaveLength(0);
        resetParams();
      });
    });
  });

  describe('handling dialect', () => {
    describe('when the dbDialect option is requested', () => {
      describe('not using windows', () => {
        function initTestWithDatabaseDialect() {
          requests.push('dbDialect');
          const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          databasePrompts.handleDialect();
        }

        it('should add a prompt to ask for the database dialect', () => {
          expect.assertions(1);
          initTestWithDatabaseDialect();
          expect(prompts).toHaveLength(1);
          resetParams();
        });

        it('should add a database dialect prompt with the correct configuration', () => {
          expect.assertions(4);
          initTestWithDatabaseDialect();
          expect(prompts[0].type).toStrictEqual('list');
          expect(prompts[0].name).toStrictEqual('dbDialect');
          expect(prompts[0].message).toStrictEqual('What\'s the database type? ');
          expect(prompts[0].choices).toStrictEqual(['postgres', 'mysql', 'mssql', 'mongodb']);
          resetParams();
        });

        it('should not change the configuration', () => {
          expect.assertions(1);
          initTestWithDatabaseDialect();
          expect(envConfig.dbDialect).toBeUndefined();
          resetParams();
        });
      });

      describe('using windows', () => {
        it('should change prompt type form `list` to `rawlist`', () => {
          expect.assertions(1);
          requests.push('dbDialect');
          const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          const platformStub = sinon.stub(process, 'platform').value('win32');
          databasePrompts.handleDialect();
          expect(prompts[0].type).toStrictEqual('rawlist');
          resetParams();
          platformStub.restore();
        });
      });
    });

    describe('when the dbDialect option is not requested', () => {
      it('should not prompt for database dialect', async () => {
        expect.assertions(4);
        resetParams();
        const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

        expect(envConfig.dbDialect).toBeUndefined();
        expect(prompts).toHaveLength(0);

        databasePrompts.handleDialect();

        expect(envConfig.dbDialect).toBeUndefined();
        expect(prompts).toHaveLength(0);
      });
    });
  });

  describe('handling name', () => {
    describe('when the dbName option is requested', () => {
      function initTestWithDatabaseName() {
        requests.push('dbName');
        const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handleName();
      }

      it('should add a prompt to ask for the database name', () => {
        expect.assertions(1);
        initTestWithDatabaseName();
        expect(prompts).toHaveLength(1);
        resetParams();
      });

      it('should add a database name prompt with the correct configuration', () => {
        expect.assertions(4);
        initTestWithDatabaseName();
        expect(prompts[0].type).toStrictEqual('input');
        expect(prompts[0].name).toStrictEqual('dbName');
        expect(prompts[0].message).toStrictEqual('What\'s the database name?');
        expect(prompts[0].validate).toBeInstanceOf(Function);
        resetParams();
      });

      it('should validate that the name has been filed', () => {
        expect.assertions(2);
        initTestWithDatabaseName();
        expect(prompts[0].validate('')).toStrictEqual('Please specify the database name.');
        expect(prompts[0].validate('name')).toStrictEqual(true);
        resetParams();
      });
    });

    describe('when the dbName option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not do prompt for database name', async () => {
        expect.assertions(4);
        expect(envConfig.dbDialect).toBeUndefined();
        expect(prompts).toHaveLength(0);

        databasePrompts.handleName();

        expect(envConfig.dbDialect).toBeUndefined();
        expect(prompts).toHaveLength(0);
      });
    });
  });

  describe('handling schema', () => {
    describe('when the dbSchema option is requested', () => {
      describe('and the dbSchema has been been passed in', () => {
        it('should add the dbSchema to the configuration', () => {
          expect.assertions(1);
          requests.push('dbSchema');
          program.schema = 'fakeSchema';
          const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          databasePrompts.handleSchema();

          expect(envConfig.dbSchema).toStrictEqual(program.schema);
          resetParams();
        });
      });

      describe('and the dbSchema has not been passed in', () => {
        function initTestWithDatabaseSchema() {
          requests.push('dbSchema');
          const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          databasePrompts.handleSchema();
        }

        it('should not add the dbSchema to the configuration', () => {
          expect.assertions(1);
          initTestWithDatabaseSchema();
          expect(envConfig.dbSchema).toBeUndefined();
          resetParams();
        });

        it('should add a prompt to ask for the database schema name', () => {
          expect.assertions(1);
          initTestWithDatabaseSchema();
          expect(prompts).toHaveLength(1);
          resetParams();
        });

        it('should add a database schema name prompt with the correct configuration', () => {
          expect.assertions(6);
          initTestWithDatabaseSchema();
          expect(prompts[0].type).toStrictEqual('input');
          expect(prompts[0].name).toStrictEqual('dbSchema');
          expect(prompts[0].message).toStrictEqual('What\'s the database schema? [optional]');
          expect(prompts[0].description).toStrictEqual('Leave blank by default');
          expect(prompts[0].when).toBeInstanceOf(Function);
          expect(prompts[0].default).toBeInstanceOf(Function);
          resetParams();
        });

        it('should be prompted only if using postgres or mssql', () => {
          expect.assertions(4);
          initTestWithDatabaseSchema();
          expect(prompts[0].when({ dbDialect: 'mongodb' })).toStrictEqual(false);
          expect(prompts[0].when({ dbDialect: 'mysql' })).toStrictEqual(false);
          expect(prompts[0].when({ dbDialect: 'postgres' })).toStrictEqual(true);
          expect(prompts[0].when({ dbDialect: 'mssql' })).toStrictEqual(true);
          resetParams();
        });

        it('should set the correct default schema values', () => {
          expect.assertions(2);
          initTestWithDatabaseSchema();
          expect(prompts[0].default({ dbDialect: 'postgres' })).toStrictEqual('public');
          expect(prompts[0].default({ dbDialect: 'mssql' })).toStrictEqual('');
          resetParams();
        });
      });
    });

    describe('when the dbSchema option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not prompt for database schema name', async () => {
        expect.assertions(4);
        expect(envConfig.dbSchema).toBeUndefined();
        expect(prompts).toHaveLength(0);

        await databasePrompts.handleSchema();

        expect(envConfig.dbSchema).toBeUndefined();
        expect(prompts).toHaveLength(0);
      });
    });
  });

  describe('handling Hostname', () => {
    describe('when the dbHostname option is requested', () => {
      function initTestWithDatabaseHostname() {
        requests.push('dbHostname');
        const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handleHostname();
      }

      it('should add a prompt to ask for the database hostname', () => {
        expect.assertions(1);
        initTestWithDatabaseHostname();
        expect(prompts).toHaveLength(1);
        resetParams();
      });

      it('should add a database hostname prompt with the correct configuration', () => {
        expect.assertions(4);
        initTestWithDatabaseHostname();
        expect(prompts[0].type).toStrictEqual('input');
        expect(prompts[0].name).toStrictEqual('dbHostname');
        expect(prompts[0].message).toStrictEqual('What\'s the database hostname?');
        expect(prompts[0].default).toStrictEqual('localhost');
        resetParams();
      });
    });

    describe('when the dbHostname option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not prompt for database hostname', () => {
        expect.assertions(4);
        expect(envConfig.dbHostname).toBeUndefined();
        expect(prompts).toHaveLength(0);

        databasePrompts.handleHostname();

        expect(envConfig.dbHostname).toBeUndefined();
        expect(prompts).toHaveLength(0);
      });
    });
  });

  describe('handling port', () => {
    describe('when the dbPort option is requested', () => {
      function initTestWithDatabasePort() {
        requests.push('dbPort');
        const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handlePort();
      }

      it('should add a prompt to ask for the database port', () => {
        expect.assertions(1);
        initTestWithDatabasePort();
        expect(prompts).toHaveLength(1);
        resetParams();
      });

      it('should add a database port prompt with the correct configuration', () => {
        expect.assertions(5);
        initTestWithDatabasePort();
        expect(prompts[0].type).toStrictEqual('input');
        expect(prompts[0].name).toStrictEqual('dbPort');
        expect(prompts[0].message).toStrictEqual('What\'s the database port?');
        expect(prompts[0].default).toBeInstanceOf(Function);
        expect(prompts[0].validate).toBeInstanceOf(Function);
        resetParams();
      });

      it('should set the correct default port values', () => {
        expect.assertions(4);
        initTestWithDatabasePort();
        expect(prompts[0].default({ dbDialect: 'postgres' })).toStrictEqual('5432');
        expect(prompts[0].default({ dbDialect: 'mysql' })).toStrictEqual('3306');
        expect(prompts[0].default({ dbDialect: 'mssql' })).toStrictEqual('1433');
        expect(prompts[0].default({ dbDialect: 'mongodb' })).toStrictEqual('27017');
        resetParams();
      });

      it('should validate the value filed', () => {
        expect.assertions(3);
        initTestWithDatabasePort();
        expect(prompts[0].validate('not a number')).toStrictEqual('The port must be a number.');
        expect(prompts[0].validate(70000)).toStrictEqual('This is not a valid port.');
        expect(prompts[0].validate(60000)).toStrictEqual(true);
        resetParams();
      });
    });

    describe('when the dbPort option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not prompt for database port', () => {
        expect.assertions(4);
        expect(envConfig.dbPort).toBeUndefined();
        expect(prompts).toHaveLength(0);

        databasePrompts.handlePort();

        expect(envConfig.dbPort).toBeUndefined();
        expect(prompts).toHaveLength(0);
      });
    });
  });

  describe('handling User', () => {
    describe('when the dbUser option is requested', () => {
      function initTestWithDatabaseUser() {
        requests.push('dbUser');
        const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handleUser();
      }

      it('should add a prompt to ask for the database user', () => {
        expect.assertions(1);
        initTestWithDatabaseUser();
        expect(prompts).toHaveLength(1);
        resetParams();
      });

      it('should add a database user prompt with the correct configuration', () => {
        expect.assertions(4);
        initTestWithDatabaseUser();
        expect(prompts[0].type).toStrictEqual('input');
        expect(prompts[0].name).toStrictEqual('dbUser');
        expect(prompts[0].message).toStrictEqual('What\'s the database user?');
        expect(prompts[0].default).toBeInstanceOf(Function);
        resetParams();
      });

      it('should set the correct default database user values', () => {
        expect.assertions(4);
        initTestWithDatabaseUser();
        expect(prompts[0].default({ dbDialect: 'mongodb' })).toBeUndefined();
        expect(prompts[0].default({ dbDialect: 'mysql' })).toStrictEqual('root');
        expect(prompts[0].default({ dbDialect: 'mssql' })).toStrictEqual('root');
        expect(prompts[0].default({ dbDialect: 'postgres' })).toStrictEqual('root');
        resetParams();
      });
    });

    describe('when the dbUser option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not prompt for database user', () => {
        expect.assertions(4);
        expect(envConfig.dbUser).toBeUndefined();
        expect(prompts).toHaveLength(0);

        databasePrompts.handleUser();

        expect(envConfig.dbUser).toBeUndefined();
        expect(prompts).toHaveLength(0);
      });
    });
  });

  describe('handling Password', () => {
    describe('when the dbPassword option is requested', () => {
      function initTestWithDatabasePassword() {
        requests.push('dbPassword');
        const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handlePassword();
      }

      it('should add a prompt to ask for the database password', () => {
        expect.assertions(1);
        initTestWithDatabasePassword();
        expect(prompts).toHaveLength(1);
        resetParams();
      });

      it('should add a database password prompt with the correct configuration', () => {
        expect.assertions(3);
        initTestWithDatabasePassword();
        expect(prompts[0].type).toStrictEqual('password');
        expect(prompts[0].name).toStrictEqual('dbPassword');
        expect(prompts[0].message).toStrictEqual('What\'s the database password? [optional]');
        resetParams();
      });
    });

    describe('when the dbPassword option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not prompt for database password', () => {
        expect.assertions(4);
        expect(envConfig.dbPassword).toBeUndefined();
        expect(prompts).toHaveLength(0);

        databasePrompts.handlePassword();

        expect(envConfig.dbPassword).toBeUndefined();
        expect(prompts).toHaveLength(0);
      });
    });
  });

  describe('handling SSL', () => {
    describe('when the ssl option is requested', () => {
      describe('and the ssl option has been passed in', () => {
        describe('if ssl is set to boolean value', () => {
          it('should set the ssl config option to boolean value', () => {
            expect.assertions(1);
            requests.push('ssl');
            program.ssl = 'true';
            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

            databasePrompts.handleSsl();

            expect(envConfig.ssl).toStrictEqual(true);
            resetParams();
          });
        });

        describe('if ssl is set to non boolean value', () => {
          it('should throw a prompter error', async () => {
            expect.assertions(2);
            requests.push('ssl');
            program.ssl = 'non boolean value';
            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
            expect(() => databasePrompts.handleSsl()).toThrow(PrompterError);
            const message = `Database SSL value must be either "true" or "false" ("${program.ssl}" given).`;
            expect(() => databasePrompts.handleSsl()).toThrow(message);
            resetParams();
          });
        });
      });

      describe('and the ssl option has not been passed in', () => {
        function initTestWithSSL() {
          requests.push('ssl');
          const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          databasePrompts.handleSsl();
        }

        it('should add a prompt to ask for the SSL configuration', () => {
          expect.assertions(1);
          initTestWithSSL();
          expect(prompts).toHaveLength(1);
          resetParams();
        });

        it('should add a SSL prompt with the correct configuration', () => {
          expect.assertions(4);
          initTestWithSSL();
          expect(prompts[0].type).toStrictEqual('confirm');
          expect(prompts[0].name).toStrictEqual('ssl');
          expect(prompts[0].message).toStrictEqual('Does your database require a SSL connection? ');
          expect(prompts[0].default).toStrictEqual(false);
          resetParams();
        });
      });
    });

    describe('when the ssl option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not prompt for ssl configuration', () => {
        expect.assertions(4);
        expect(envConfig.ssl).toBeUndefined();
        expect(prompts).toHaveLength(0);

        databasePrompts.handleSsl();

        expect(envConfig.ssl).toBeUndefined();
        expect(prompts).toHaveLength(0);
      });
    });
  });

  describe('handling Mongodb Srv', () => {
    describe('when the mongodbSrv option is requested', () => {
      function initTestWithMongoSrv() {
        requests.push('mongodbSrv');
        const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handleMongodbSrv();
      }

      it('should add a prompt to ask for the MongodbSrv configuration', () => {
        expect.assertions(1);
        initTestWithMongoSrv();
        expect(prompts).toHaveLength(1);
        resetParams();
      });

      it('should add a MongodbSrv prompt with the correct configuration', () => {
        expect.assertions(5);
        initTestWithMongoSrv();
        expect(prompts[0].type).toStrictEqual('confirm');
        expect(prompts[0].name).toStrictEqual('mongodbSrv');
        expect(prompts[0].message).toStrictEqual('Use a SRV connection string? ');
        expect(prompts[0].default).toStrictEqual(false);
        expect(prompts[0].when).toBeInstanceOf(Function);
        resetParams();
      });

      it('should only be prompted if using mongodb', () => {
        expect.assertions(4);
        initTestWithMongoSrv();
        expect(prompts[0].when({ dbDialect: 'mongodb' })).toStrictEqual(true);
        expect(prompts[0].when({ dbDialect: 'mssql' })).toStrictEqual(false);
        expect(prompts[0].when({ dbDialect: 'mysql' })).toStrictEqual(false);
        expect(prompts[0].when({ dbDialect: 'postgres' })).toStrictEqual(false);
        resetParams();
      });
    });

    describe('when the mongodbSrv option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not prompt for MongodbSrv configuration', () => {
        expect.assertions(2);
        expect(prompts).toHaveLength(0);

        databasePrompts.handleMongodbSrv();

        expect(prompts).toHaveLength(0);
      });
    });
  });
});

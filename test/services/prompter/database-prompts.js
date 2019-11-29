const {
  describe,
  it,
  after,
  before,
} = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const DatabasePrompts = require('../../../services/prompter/database-prompts');
const messages = require('../../../utils/messages');

describe('Services > Prompter > Database prompts', () => {
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

  describe('Handling database related prompts', () => {
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

    before(async () => {
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

    after(() => {
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
      expect(connectionUrlHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the dialect', () => {
      expect(dialectHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the name', () => {
      expect(nameHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the schema', () => {
      expect(schemaHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the port', () => {
      expect(portHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the user', () => {
      expect(userHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle the password', () => {
      expect(passwordHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle ssl usage', () => {
      expect(sslHandlerStub.calledOnce).to.equal(true);
    });

    it('should handle mongodb srv usage', () => {
      expect(mongoSrvHandlerStub.calledOnce).to.equal(true);
    });
  });

  describe('Handling connection url : ', () => {
    describe('When the dbConnectionUrl option is requested', () => {
      describe('and the dbConnectionUrl has already been passed in', () => {
        describe('and the dbConnectionUrl is valid', () => {
          before(() => {
            requests.push('dbConnectionUrl');
          });

          after(() => {
            resetParams();
          });

          it('should add the dbConnectionUrl to the configuration', async () => {
            program.connectionUrl = 'postgres://username:password@host:port/database';

            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

            await databasePrompts.handleConnectionUrl();

            expect(envConfig.dbConnectionUrl).to.equal('postgres://username:password@host:port/database');
          });

          it('should add the dbDialect to configuration', async () => {
            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

            program.connectionUrl = 'postgres://username:password@host:port/database';

            await databasePrompts.handleConnectionUrl();

            expect(envConfig.dbDialect).to.equal('postgres');
          });

          it('should add the mongo dbDialect to configuration when using mongo+srv', async () => {
            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

            program.connectionUrl = 'mongodb+srv://username:password@host1:port1/database';

            await databasePrompts.handleConnectionUrl();

            expect(envConfig.dbDialect).to.equal('mongodb');
          });
        });

        describe('and the dbConnectionUrl is invalid', async () => {
          let databasePrompts;

          before(() => {
            requests.push('dbConnectionUrl');
            program.connectionUrl = 'invalid';
            databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          });

          after(() => {
            resetParams();
          });

          it('should throw a prompter error', async () => {
            try {
              await databasePrompts.handleConnectionUrl();
              expect.fail('An error should have been thrown');
            } catch (e) {
              expect(e.errorMessage).to.equal(messages.ERROR_NOT_PARSABLE_CONNECTION_URL);
              expect(e.logs).to.deep.equal([messages.ERROR_NOT_PARSABLE_CONNECTION_URL]);
            }
          });
        });
      });
    });

    describe('When the dbConnectionUrl option is not requested', () => {
      let databasePrompts;

      before(() => {
        program.connectionUrl = 'postgres://username:password@host:port/database';
        databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
      });

      after(() => {
        resetParams();
      });

      it('should not do anything', async () => {
        expect(envConfig.dbConnectionUrl).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        await databasePrompts.handleConnectionUrl();

        expect(envConfig.dbConnectionUrl).to.equal(undefined);
        expect(envConfig.dbConnectionUrl).to.not.equal('postgres://username:password@host:port/database');
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling dialect : ', () => {
    describe('When the dbDialect option is requested', () => {
      describe('not using windows', () => {
        let databasePrompts;

        before(() => {
          requests.push('dbDialect');

          databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          databasePrompts.handleDialect();
        });

        after(() => {
          resetParams();
        });

        it('should add a prompt to ask for it', () => {
          expect(prompts).to.have.lengthOf(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect(prompts[0].type).to.equal('list');
          expect(prompts[0].name).to.equal('dbDialect');
          expect(prompts[0].message).to.equal('What\'s the database type? ');
          expect(prompts[0].choices).to.deep.equal(['postgres', 'mysql', 'mssql', 'mongodb']);
        });

        it('should not change the configuration', () => {
          expect(envConfig.dbDialect).to.equal(undefined);
        });
      });

      describe('using windows', async () => {
        let databasePrompts;
        let platformStub;

        before(() => {
          requests.push('dbDialect');
          databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          platformStub = sinon.stub(process, 'platform').value('win32');
          databasePrompts.handleDialect();
        });

        after(() => {
          resetParams();
          platformStub.restore();
        });

        it('should change prompt type form `list` to `rawlist`', () => {
          expect(prompts[0].type).to.equal('rawlist');
        });
      });
    });

    describe('When the dbDialect option is not requested', () => {
      let databasePrompts;

      before(() => {
        resetParams();
        databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
      });

      it('should not do anything', async () => {
        expect(envConfig.dbDialect).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handleDialect();

        expect(envConfig.dbDialect).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling name : ', () => {
    describe('When the dbName option is requested', () => {
      let databasePrompts;

      before(() => {
        requests.push('dbName');
        databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handleName();
      });

      after(() => {
        resetParams();
      });

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('input');
        expect(prompts[0].name).to.equal('dbName');
        expect(prompts[0].message).to.equal('What\'s the database name?');
        expect(prompts[0].validate).to.be.a('function');
      });

      it('should validate that the name has been filed', () => {
        expect(prompts[0].validate('')).to.equal('Please specify the database name.');
        expect(prompts[0].validate('name')).to.equal(true);
      });
    });

    describe('When the dbName option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not do anything', async () => {
        expect(envConfig.dbDialect).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handleName();

        expect(envConfig.dbDialect).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling schema : ', () => {
    describe('When the dbSchema option is requested', () => {
      describe('and the dbSchema has been been passed in', () => {
        let databasePrompts;

        before(() => {
          requests.push('dbSchema');
          program.schema = 'fakeSchema';
          databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          databasePrompts.handleSchema();
        });

        after(() => {
          resetParams();
        });

        it('should add the dbSchema to the configuration', () => {
          expect(envConfig.dbSchema).to.equal(program.schema);
        });
      });

      describe('and the dbSchema has not been passed in', () => {
        let databasePrompts;

        before(() => {
          requests.push('dbSchema');
          databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          databasePrompts.handleSchema();
        });

        after(() => {
          resetParams();
        });

        it('should not add the dbSchema to the configuration', () => {
          expect(envConfig.dbSchema).to.equal(undefined);
        });

        it('should add a prompt to ask for it', () => {
          expect(prompts).to.have.lengthOf(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect(prompts[0].type).to.equal('input');
          expect(prompts[0].name).to.equal('dbSchema');
          expect(prompts[0].message).to.equal('What\'s the database schema? [optional]');
          expect(prompts[0].description).to.equal('Leave blank by default');
          expect(prompts[0].when).to.be.a('function');
          expect(prompts[0].default).to.be.a('function');
        });

        it('should be prompted only if using postgres or mssql', () => {
          expect(prompts[0].when({ dbDialect: 'mongodb' })).to.equal(false);
          expect(prompts[0].when({ dbDialect: 'mysql' })).to.equal(false);
          expect(prompts[0].when({ dbDialect: 'postgres' })).to.equal(true);
          expect(prompts[0].when({ dbDialect: 'mssql' })).to.equal(true);
        });

        it('should set the correct default value', () => {
          expect(prompts[0].default({ dbDialect: 'postgres' })).to.equal('public');
          expect(prompts[0].default({ dbDialect: 'mssql' })).to.equal('dbo');
        });
      });
    });

    describe('When the dbSchema option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not do anything', async () => {
        expect(envConfig.dbSchema).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        await databasePrompts.handleSchema();

        expect(envConfig.dbSchema).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling Hostname : ', () => {
    describe('When the dbHostname option is requested', () => {
      let databasePrompts;

      before(() => {
        requests.push('dbHostname');
        databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handleHostname();
      });

      after(() => {
        resetParams();
      });

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('input');
        expect(prompts[0].name).to.equal('dbHostname');
        expect(prompts[0].message).to.equal('What\'s the database hostname?');
        expect(prompts[0].default).to.equal('localhost');
      });
    });

    describe('When the dbHostname option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not do anything', () => {
        expect(envConfig.dbHostname).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handleHostname();

        expect(envConfig.dbHostname).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling port : ', () => {
    describe('When the dbPort option is requested', () => {
      let databasePrompts;

      before(() => {
        requests.push('dbPort');
        databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handlePort();
      });

      after(() => {
        resetParams();
      });

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('input');
        expect(prompts[0].name).to.equal('dbPort');
        expect(prompts[0].message).to.equal('What\'s the database port?');
        expect(prompts[0].default).to.be.a('function');
        expect(prompts[0].validate).to.be.a('function');
      });

      it('should set the correct default value', () => {
        expect(prompts[0].default({ dbDialect: 'postgres' })).to.equal('5432');
        expect(prompts[0].default({ dbDialect: 'mysql' })).to.equal('3306');
        expect(prompts[0].default({ dbDialect: 'mssql' })).to.equal('1433');
        expect(prompts[0].default({ dbDialect: 'mongodb' })).to.equal('27017');
      });

      it('should validate the value filed', () => {
        expect(prompts[0].validate('not a number')).to.equal('The port must be a number.');
        expect(prompts[0].validate(70000)).to.equal('This is not a valid port.');
        expect(prompts[0].validate(60000)).to.equal(true);
      });
    });

    describe('When the dbPort option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not do anything', () => {
        expect(envConfig.dbPort).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handlePort();

        expect(envConfig.dbPort).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling User : ', () => {
    describe('When the dbUser option is requested', () => {
      let databasePrompts;

      before(() => {
        requests.push('dbUser');
        databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handleUser();
      });

      after(() => {
        resetParams();
      });

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('input');
        expect(prompts[0].name).to.equal('dbUser');
        expect(prompts[0].message).to.equal('What\'s the database user?');
        expect(prompts[0].default).to.be.a('function');
      });

      it('should set the correct default value', () => {
        expect(prompts[0].default({ dbDialect: 'mongodb' })).to.equal(undefined);
        expect(prompts[0].default({ dbDialect: 'mysql' })).to.equal('root');
        expect(prompts[0].default({ dbDialect: 'mssql' })).to.equal('root');
        expect(prompts[0].default({ dbDialect: 'postgres' })).to.equal('root');
      });
    });

    describe('When the dbUser option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not do anything', () => {
        expect(envConfig.dbUser).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handleUser();

        expect(envConfig.dbUser).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling Password : ', () => {
    describe('When the dbPassword option is requested', () => {
      let databasePrompts;

      before(() => {
        requests.push('dbPassword');
        databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handlePassword();
      });

      after(() => {
        resetParams();
      });

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('password');
        expect(prompts[0].name).to.equal('dbPassword');
        expect(prompts[0].message).to.equal('What\'s the database password? [optional]');
      });
    });

    describe('When the dbPassword option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not do anything', () => {
        expect(envConfig.dbPassword).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handlePassword();

        expect(envConfig.dbPassword).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling SSL : ', () => {
    describe('When the sll option is requested', () => {
      describe('and the ssl option has been passed in', () => {
        before(() => {
          requests.push('ssl');
        });

        describe('if ssl is set to boolean value', () => {
          before(() => {
            program.ssl = 'true';
          });

          it('should set the ssl config option to boolean value', () => {
            const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

            databasePrompts.handleSsl();

            expect(envConfig.ssl).to.equal(true);
          });
        });

        describe('if ssl is set to non boolean value', () => {
          let databasePrompts;

          before(() => {
            program.ssl = 'non boolean value';
            databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          });

          after(() => {
            resetParams();
          });

          it('should throw a prompter error', async () => {
            try {
              databasePrompts.handleSsl();
              expect.fail('An error should have been thrown');
            } catch (e) {
              const message = `Database SSL value must be either "true" or "false" ("${program.ssl}" given).`;
              expect(e.errorMessage).to.equal(message);
              expect(e.logs).to.deep.equal([message]);
            }
          });
        });
      });

      describe('and the ssl option has not been passed in', () => {
        let databasePrompts;

        before(() => {
          requests.push('ssl');
          databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
          databasePrompts.handleSsl();
        });

        after(() => {
          resetParams();
        });

        it('should add a prompt to ask for it', () => {
          expect(prompts).to.have.lengthOf(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect(prompts[0].type).to.equal('confirm');
          expect(prompts[0].name).to.equal('ssl');
          expect(prompts[0].message).to.equal('Does your database require a SSL connection? ');
          expect(prompts[0].default).to.equal(false);
        });
      });
    });

    describe('When the ssl option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not do anything', () => {
        expect(envConfig.ssl).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handleSsl();

        expect(envConfig.ssl).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling Mongodb Srv : ', () => {
    describe('When the mongodbSrv option is requested', () => {
      let databasePrompts;

      before(() => {
        requests.push('mongodbSrv');
        databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);
        databasePrompts.handleMongodbSrv();
      });

      after(() => {
        resetParams();
      });

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('confirm');
        expect(prompts[0].name).to.equal('mongodbSrv');
        expect(prompts[0].message).to.equal('Use a SRV connection string? ');
        expect(prompts[0].default).to.equal(false);
        expect(prompts[0].when).to.be.a('function');
      });

      it('should only be prompted if using mongodb', () => {
        expect(prompts[0].when({ dbDialect: 'mongodb' })).to.equal(true);
        expect(prompts[0].when({ dbDialect: 'mssql' })).to.equal(false);
        expect(prompts[0].when({ dbDialect: 'mysql' })).to.equal(false);
        expect(prompts[0].when({ dbDialect: 'postgres' })).to.equal(false);
      });
    });

    describe('When the mongodbSrv option is not requested', () => {
      const databasePrompts = new DatabasePrompts(requests, envConfig, prompts, program);

      it('should not do anything', () => {
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handleMongodbSrv();

        expect(prompts).to.have.lengthOf(0);
      });
    });
  });
});

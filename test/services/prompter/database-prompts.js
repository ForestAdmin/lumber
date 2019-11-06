const {
  describe,
  it,
  after,
  before,
  afterEach,
} = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const DatabasePrompts = require('../../../services/prompter/database-prompts');
const eventSender = require('../../../services/event-sender');
const logger = require('../../../services/logger');

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

          const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

          it('should add the dbConnectionUrl to the configuration', async () => {
            program.connectionUrl = 'postgres://username:password@host:port/database';

            await databasePrompts.handleConnectionUrl();

            expect(envConfig.dbConnectionUrl).to.equal(program.connectionUrl);
          });

          it('should add the dbDialect to configuration', async () => {
            program.connectionUrl = 'postgres://username:password@host:port/database';

            await databasePrompts.handleConnectionUrl();

            expect(envConfig.dbDialect).to.equal('postgres');
          });

          it('should add the mongo dbDialect to configuration when using mongo+srv', async () => {
            program.connectionUrl = 'mongodb+srv://username:password@host1:port1/database';

            await databasePrompts.handleConnectionUrl();

            expect(envConfig.dbDialect).to.equal('mongodb');
          });
        });

        describe('and the dbConnectionUrl is invalid', async () => {
          const loggerSpy = sinon.spy(logger, 'error');
          const eventSenderSpy = sinon.spy(eventSender, 'notifyError');
          const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

          before(() => {
            sinon.stub(process, 'exit');
            requests.push('dbConnectionUrl');
            program.connectionUrl = 'invalid';
          });

          afterEach(() => {
            loggerSpy.resetHistory();
            eventSenderSpy.resetHistory();
            process.exit.resetHistory();
          });

          after(() => {
            resetParams();
            process.exit.restore();
          });

          it('should terminate the process with exit code 1', async () => {
            await databasePrompts.handleConnectionUrl();

            expect(process.exit.calledOnce);
            expect(process.exit.calledWith(1));
          });

          it('should log an error message', async () => {
            const message = 'Cannot parse the database dialect. Please, check the syntax of the database connection string.';

            await databasePrompts.handleConnectionUrl();

            expect(loggerSpy.calledOnce);
            expect(loggerSpy.getCall(0).args[0]).to.equal(message);
          });

          it('should send an event', async () => {
            const firstArgument = 'unknown_error';
            const secondArgument = 'Cannot parse the database dialect. Please, check the syntax of the database connection string.';

            await databasePrompts.handleConnectionUrl();

            expect(eventSenderSpy.calledOnce);
            expect(eventSenderSpy.getCall(0).args[0]).to.equal(firstArgument);
            expect(eventSenderSpy.getCall(0).args[1]).to.equal(secondArgument);
          });
        });
      });
    });

    describe('When the dbConnectionUrl option is not requested', () => {
      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

      it('should not do anything', async () => {
        expect(envConfig.appHostname).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        await databasePrompts.handleConnectionUrl();

        expect(envConfig.appHostname).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling dialect : ', () => {
    describe('When the dbDialect option is requested', () => {
      describe('not using windows', () => {
        before(() => {
          requests.push('dbDialect');
        });

        after(() => {
          resetParams();
        });

        const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

        databasePrompts.handleDialect();

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
        let platformStub;

        before(() => {
          requests.push('dbDialect');
          platformStub = sinon.stub(process, 'platform').value('win');
        });

        after(() => {
          resetParams();
          platformStub.restore();
        });

        const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

        databasePrompts.handleDialect();

        it('should change prompt type form `list` to `rawlist`', () => {
          expect(prompts[0].type).to.equal('rawlist');
        });
      });
    });

    describe('When the dbDialect option is not requested', () => {
      before(() => {
        resetParams();
      });

      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

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
      before(() => {
        requests.push('dbName');
      });

      after(() => {
        resetParams();
      });

      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

      databasePrompts.handleName();

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('input');
        expect(prompts[0].name).to.equal('dbName');
        expect(prompts[0].message).to.equal('What\'s the database name?');
        expect(prompts[0].when).to.be.a('function');
        expect(prompts[0].validate).to.be.a('function');
      });

      it('should validate that the name has been filed', () => {
        expect(prompts[0].validate('')).to.equal('Please specify the database name.');
        expect(prompts[0].validate('name')).to.equal(true);
      });

      it('should only add the prompt if not using sqlite', () => {
        expect(prompts[0].when({ dbDialect: 'pgsql' })).to.equal(true);
        expect(prompts[0].when({ dbDialect: 'sqlite' })).to.equal(false);
      });
    });

    describe('When the dbName option is not requested', () => {
      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

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
      describe('and the dbSchema has not been passed in', () => {
        before(() => {
          requests.push('dbSchema');
          program.schema = 'fake schema';
        });

        after(() => {
          resetParams();
        });

        const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

        databasePrompts.handleSchema();

        it('should add the dbSchema to the configuration', () => {
          expect(envConfig.dbSchema).to.equal(program.dbSchema);
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

        it('should not be prompted if using sqlite, mongodb, and mysql', () => {
          expect(prompts[0].when({ dbDialect: 'sqlite' })).to.equal(false);
          expect(prompts[0].when({ dbDialect: 'mongodb' })).to.equal(false);
          expect(prompts[0].when({ dbDialect: 'mysql' })).to.equal(false);
        });

        it('should set the correct default value', () => {
          expect(prompts[0].default({ dbDialect: 'postgres' })).to.equal('public');
          expect(prompts[0].default({ dbDialect: 'mysql' })).to.equal('');
        });
      });

      describe('and the dbSchema has not been passed in', () => {
        before(() => {
          requests.push('dbSchema');
        });

        after(() => {
          resetParams();
        });

        const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

        databasePrompts.handleSchema();

        it('should add the dbSchema to the configuration', () => {
          expect(envConfig.dbSchema).to.equal(program.dbSchema);
        });
      });
    });

    describe('When the dbSchema option is not requested', () => {
      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

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
      before(() => {
        requests.push('dbHostname');
      });

      after(() => {
        resetParams();
      });

      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

      databasePrompts.handleHostname();

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('input');
        expect(prompts[0].name).to.equal('dbHostname');
        expect(prompts[0].message).to.equal('What\'s the database hostname?');
        expect(prompts[0].default).to.equal('localhost');
        expect(prompts[0].when).to.be.a('function');
      });

      it('should not be prompted if using sqlite', () => {
        expect(prompts[0].when({ dbDialect: 'sqlite' })).to.equal(false);
        expect(prompts[0].when({ dbDialect: 'mysql' })).to.equal(true);
      });
    });

    describe('When the dbHostname option is not requested', () => {
      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

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
      before(() => {
        requests.push('dbPort');
      });

      after(() => {
        resetParams();
      });

      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

      databasePrompts.handlePort();

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('input');
        expect(prompts[0].name).to.equal('dbPort');
        expect(prompts[0].message).to.equal('What\'s the database port?');
        expect(prompts[0].when).to.be.a('function');
        expect(prompts[0].default).to.be.a('function');
        expect(prompts[0].validate).to.be.a('function');
      });

      it('should not be prompted if using sqlite', () => {
        expect(prompts[0].when({ dbDialect: 'sqlite' })).to.equal(false);
        expect(prompts[0].when({ dbDialect: 'mysql' })).to.equal(true);
      });

      it('should set the correct default value', () => {
        expect(prompts[0].default({ dbDialect: 'postgres' })).to.equal('5432');
        expect(prompts[0].default({ dbDialect: 'mysql' })).to.equal('3306');
        expect(prompts[0].default({ dbDialect: 'mssql' })).to.equal('1433');
        expect(prompts[0].default({ dbDialect: 'mongodb' })).to.equal('27017');
        expect(prompts[0].default({ dbDialect: 'else' })).to.equal(undefined);
      });

      it('should validate the value filed', () => {
        expect(prompts[0].validate('not a number')).to.equal('The port must be a number.');
        expect(prompts[0].validate(70000)).to.equal('This is not a valid port.');
        expect(prompts[0].validate(60000)).to.equal(true);
      });
    });

    describe('When the dbPort option is not requested', () => {
      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

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
      before(() => {
        requests.push('dbUser');
      });

      after(() => {
        resetParams();
      });

      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

      databasePrompts.handleUser();

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('input');
        expect(prompts[0].name).to.equal('dbUser');
        expect(prompts[0].message).to.equal('What\'s the database user?');
        expect(prompts[0].when).to.be.a('function');
        expect(prompts[0].default).to.be.a('function');
      });

      it('should not be prompted if using sqlite', () => {
        expect(prompts[0].when({ dbDialect: 'sqlite' })).to.equal(false);
        expect(prompts[0].when({ dbDialect: 'anything else' })).to.equal(true);
      });

      it('should set the correct default value', () => {
        expect(prompts[0].default({ dbDialect: 'mongodb' })).to.equal(undefined);
        expect(prompts[0].default({ dbDialect: 'anything else' })).to.equal('root');
      });
    });

    describe('When the dbUser option is not requested', () => {
      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

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
      before(() => {
        requests.push('sll');
      });

      after(() => {
        resetParams();
      });

      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

      databasePrompts.handlePassword();

      it('should add a prompt to ask for it', () => {
        expect(prompts).to.have.lengthOf(1);
      });

      it('should add a prompt with the correct configuration', () => {
        expect(prompts[0].type).to.equal('password');
        expect(prompts[0].name).to.equal('dbPassword');
        expect(prompts[0].message).to.equal('What\'s the database password? [optional]');
        expect(prompts[0].when).to.be.a('function');
      });

      it('should not be prompted if using sqlite', () => {
        expect(prompts[0].when({ dbDialect: 'sqlite' })).to.equal(false);
        expect(prompts[0].when({ dbDialect: 'anything else' })).to.equal(true);
      });
    });

    describe('When the dbPassword option is not requested', () => {
      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

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
        let loggerStub;

        before(() => {
          requests.push('ssl');
          program.ssl = true;
        });

        describe('if ssl is set to boolean value', () => {
          after(() => {
            resetParams();
          });

          it('should set the ssl config option to boolean value', () => {
            const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

            databasePrompts.handleSsl();

            expect(envConfig.ssl).to.equal(true);
          });
        });

        describe('if ssl is set to not boolean value', () => {
          let loggerSpy;
          let processStub;

          before(() => {
            program.ssl = 'non boolean value';
            loggerStub = sinon.spy(logger, 'error');
            processStub = sinon.stub(process, 'exit');
          });

          after(() => {
            loggerStub.restore();
            processStub.restore();
            resetParams();
          });

          const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

          databasePrompts.handleSsl();

          it('should log an error', () => {
            const message = `Database SSL value must be either "true" or "false" ("${program.ssl}" given).`;
            expect(loggerSpy.calledOnce);
            expect(loggerSpy.getCall(0).args[0]).to.equal(message);
          });

          it('should terminate the process with exit code 1', () => {
            expect(processStub.calledOnce);
            expect(processStub.getCall(0).args[0].to.equal(1));
          });
        });

        const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

        databasePrompts.handleSsl();

        it('should add a prompt to ask for it', () => {
          expect(prompts).to.have.lengthOf(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect(prompts[0].type).to.equal('password');
          expect(prompts[0].name).to.equal('dbPassword');
          expect(prompts[0].message).to.equal('What\'s the database password? [optional]');
          expect(prompts[0].when).to.be.a('function');
        });

        it('should not be prompted if using sqlite', () => {
          expect(prompts[0].when({ dbDialect: 'sqlite' })).to.equal(false);
          expect(prompts[0].when({ dbDialect: 'mysql' })).to.equal(true);
        });
      });

      describe('and the ssl option has not been passed in', () => {
        before(() => {
          requests.push('ssl');
        });

        after(() => {
          resetParams();
        });

        const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

        databasePrompts.handleSsl();

        it('should add a prompt to ask for it', () => {
          expect(prompts).to.have.lengthOf(1);
        });

        it('should add a prompt with the correct configuration', () => {
          expect(prompts[0].type).to.equal('confirm');
          expect(prompts[0].name).to.equal('ssl');
          expect(prompts[0].message).to.equal('Does your database require a SSL connection? ');
          expect(prompts[0].default).to.equal(false);
          expect(prompts[0].when).to.be.a('function');
        });

        it('should not be prompted if using sqlite', () => {
          expect(prompts[0].when({ dbDialect: 'sqlite' })).to.equal(false);
          expect(prompts[0].when({ dbDialect: 'anything else' })).to.equal(true);
        });
      });
    });

    describe('When the sll option is not requested', () => {
      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

      it('should not do anything', () => {
        expect(envConfig.ssl).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handlePassword();

        expect(envConfig.ssl).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });

  describe('Handling Mongodb Srv : ', () => {
    describe('When the mongodbSrv option is requested', () => {
      before(() => {
        requests.push('mongodbSrv');
      });

      after(() => {
        resetParams();
      });

      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

      databasePrompts.handleMongodbSrv();

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
        expect(prompts[0].when({ dbDialect: 'anything else' })).to.equal(false);
      });
    });

    describe('When the dbPassword option is not requested', () => {
      const databasePrompts = new DatabasePrompts(program, envConfig, prompts, requests);

      it('should not do anything', () => {
        expect(envConfig.dbPassword).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);

        databasePrompts.handlePassword();

        expect(envConfig.dbPassword).to.equal(undefined);
        expect(prompts).to.have.lengthOf(0);
      });
    });
  });
});

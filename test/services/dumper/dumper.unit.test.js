const chalk = require('chalk');
const Dumper = require('../../../services/dumper');
const InvalidLumberProjectStructureError = require('../../../utils/errors/dumper/invalid-lumber-project-structure-error');
const IncompatibleLianaForUpdateError = require('../../../utils/errors/dumper/incompatible-liana-for-update-error');

const SequelizeMock = {
  DataTypes: {},
};

const ABSOLUTE_PROJECT_PATH = '/absolute/project/path';
const RELATIVE_FILE_PATH = 'some/folder/relative-file.js';

const DEFAULT_FOREST_URL = 'https://api.someforesturl.com';

function createDumper(contextOverride = {}) {
  return new Dumper({
    constants: {
      DEFAULT_FOREST_URL,
    },
    Sequelize: SequelizeMock,
    chalk,
    mkdirp: () => {},
    ...contextOverride,
  });
}

describe('services > dumper (unit)', () => {
  describe('isLinuxBasedOs', () => {
    it('should return true on linux', () => {
      expect.assertions(1);

      const dumper = createDumper({
        os: {
          platform: jest.fn().mockReturnValue('linux'),
        },
      });

      expect(dumper.isLinuxBasedOs()).toStrictEqual(true);
    });

    it('should return false on other OS', () => {
      expect.assertions(1);

      const dumper = createDumper({
        os: {
          platform: jest.fn().mockReturnValue('windows'),
        },
      });

      expect(dumper.isLinuxBasedOs()).toStrictEqual(false);
    });
  });

  describe('writeFile', () => {
    describe('when file does not exists', () => {
      const context = {
        logger: {
          log: jest.fn(),
        },
        fs: {
          writeFileSync: jest.fn(),
          existsSync: jest.fn().mockReturnValue(false),
        },
      };
      createDumper(context).writeFile(ABSOLUTE_PROJECT_PATH, RELATIVE_FILE_PATH, 'content');

      it('should call writeFileSync to write the file', () => {
        expect.assertions(2);

        expect(context.fs.writeFileSync).toHaveBeenCalledTimes(1);
        expect(context.fs.writeFileSync).toHaveBeenCalledWith(`${ABSOLUTE_PROJECT_PATH}/${RELATIVE_FILE_PATH}`, 'content');
      });

      it('should call the logger to display a create log message', () => {
        expect.assertions(2);

        expect(context.logger.log).toHaveBeenCalledTimes(1);
        expect(context.logger.log).toHaveBeenCalledWith(`  ${chalk.green('create')} ${RELATIVE_FILE_PATH}`);
      });
    });

    describe('when file exists', () => {
      const context = {
        logger: {
          log: jest.fn(),
        },
        fs: {
          writeFileSync: jest.fn(),
          existsSync: jest.fn().mockReturnValue(true),
        },
      };
      createDumper(context).writeFile(ABSOLUTE_PROJECT_PATH, RELATIVE_FILE_PATH, 'content');

      it('should not write the file', () => {
        expect.assertions(1);

        expect(context.fs.writeFileSync).not.toHaveBeenCalled();
      });

      it('should call the logger to display a skip log message', () => {
        expect.assertions(2);

        expect(context.logger.log).toHaveBeenCalledTimes(1);
        expect(context.logger.log).toHaveBeenCalledWith(`  ${chalk.yellow('skip')} ${RELATIVE_FILE_PATH} - already exist.`);
      });
    });
  });

  describe('copyTemplate', () => {
    it('should call writeFile with computed parameters', () => {
      expect.assertions(2);

      const dumper = createDumper({
        fs: {
          readFileSync: jest.fn().mockReturnValue('content'),
        },
      });
      const writeFileSpy = jest.spyOn(dumper, 'writeFile').mockImplementation(() => {});
      dumper.copyTemplate(ABSOLUTE_PROJECT_PATH, 'from.js', 'to.js');

      expect(writeFileSpy).toHaveBeenCalledTimes(1);
      expect(writeFileSpy).toHaveBeenCalledWith(ABSOLUTE_PROJECT_PATH, 'to.js', 'content');
    });
  });

  describe('copyHandleBarsTemplate', () => {
    const context = {
      Handlebars: {
        compile: () => jest.fn().mockReturnValue('content'),
      },
      fs: {
        readFileSync: jest.fn(),
      },
    };
    const dumper = createDumper(context);

    describe('with missing parameters', () => {
      it('should throw an error', () => {
        expect.assertions(1);

        expect(() => dumper.copyHandleBarsTemplate({}))
          .toThrow('Missing argument (projectPath, source, target or context).');
      });
    });

    describe('with all the required parameters', () => {
      it('should call writeFile with computed parameters', () => {
        expect.assertions(2);

        const writeFileSpy = jest.spyOn(dumper, 'writeFile').mockImplementation(() => {});
        dumper.copyHandleBarsTemplate({
          projectPath: ABSOLUTE_PROJECT_PATH,
          source: 'from.js',
          target: 'to.js',
          context: {},
        });

        expect(writeFileSpy).toHaveBeenCalledTimes(1);
        expect(writeFileSpy).toHaveBeenCalledWith(ABSOLUTE_PROJECT_PATH, 'to.js', 'content');
      });
    });
  });

  describe('writePackageJson', () => {
    it('should call write file with a valid package.json file content', () => {
      expect.assertions(6);

      const dumper = createDumper({});
      const writeFileSpy = jest.spyOn(dumper, 'writeFile').mockImplementation(() => {});
      dumper.writePackageJson(ABSOLUTE_PROJECT_PATH, {
        dbDialect: 'none',
        appName: 'test',
      });

      const fileContent = writeFileSpy.mock.calls[0][2];
      expect(writeFileSpy).toHaveBeenCalledTimes(1);
      expect(() => JSON.parse(fileContent)).not.toThrow();

      const parsedPackageJson = JSON.parse(fileContent);

      expect(parsedPackageJson.name).toStrictEqual('test');
      expect(parsedPackageJson.version).toStrictEqual('0.0.1');
      expect(parsedPackageJson.private).toStrictEqual(true);
      expect(parsedPackageJson.scripts).toStrictEqual({ start: 'node ./server.js' });
    });

    describe('with specific database dialect', () => {
      const getPackageJSONContentFromDialect = (dbDialect) => {
        const dumper = createDumper({});
        const writeFileSpy = jest.spyOn(dumper, 'writeFile').mockImplementation(() => {});
        dumper.writePackageJson(ABSOLUTE_PROJECT_PATH, {
          dbDialect,
          appName: 'test',
        });

        return writeFileSpy.mock.calls[0][2];
      };

      it('undefined: it should not add any dbs connector', () => {
        expect.assertions(4);

        const packageJson = getPackageJSONContentFromDialect(undefined);

        expect(packageJson).not.toContain('pg');
        expect(packageJson).not.toContain('mysql2');
        expect(packageJson).not.toContain('tedious');
        expect(packageJson).not.toContain('mongoose');
      });

      it('postgres: it should add pg dependency', () => {
        expect.assertions(1);

        expect(getPackageJSONContentFromDialect('postgres')).toContain('pg');
      });

      it('mysql: it should add mysql2 dependency', () => {
        expect.assertions(1);

        expect(getPackageJSONContentFromDialect('mysql')).toContain('mysql2');
      });

      it('mssql: it should add tedious dependency', () => {
        expect.assertions(1);

        expect(getPackageJSONContentFromDialect('mssql')).toContain('tedious');
      });

      it('mongodb: it should add mongoose dependency', () => {
        expect.assertions(1);

        expect(getPackageJSONContentFromDialect('mongodb')).toContain('mongoose');
      });
    });
  });

  describe('tableToFilename', () => {
    it('should return a kebab case version of the given parameter', () => {
      expect.assertions(3);

      expect(Dumper.tableToFilename('test')).toStrictEqual('test');
      expect(Dumper.tableToFilename('testSomething')).toStrictEqual('test-something');
      expect(Dumper.tableToFilename('test_something_else')).toStrictEqual('test-something-else');
    });
  });

  describe('getDatabaseUrl', () => {
    it('should return the dbConnectionUrl if provided', () => {
      expect.assertions(1);

      const config = {
        dbConnectionUrl: 'mysql://root:password@localhost:3306/forest',
      };

      expect(Dumper.getDatabaseUrl(config)).toStrictEqual(config.dbConnectionUrl);
    });

    it('should return the connection string if no dbConnectionUrl is provided', () => {
      expect.assertions(1);

      const config = {
        dbDialect: 'mysql',
        dbPort: 3306,
        dbUser: 'root',
        dbHostname: 'localhost',
        dbName: 'forest',
      };

      expect(Dumper.getDatabaseUrl(config)).toStrictEqual('mysql://root@localhost:3306/forest');
    });

    it('should remove the port if mongodbSrv is provided', () => {
      expect.assertions(1);

      const config = {
        dbDialect: 'mongodb',
        dbPort: 27017,
        mongodbSrv: true,
        dbUser: 'root',
        dbPassword: 'password',
        dbHostname: 'localhost',
        dbName: 'forest',
      };

      expect(Dumper.getDatabaseUrl(config)).toStrictEqual('mongodb+srv://root:password@localhost/forest');
    });
  });

  describe('isDatabaseLocal', () => {
    it('should return true for a config referring to a database hosted locally', () => {
      expect.assertions(1);

      const dbConnectionUrl = 'mongodb+srv://root:password@localhost/forest';

      expect(Dumper.isDatabaseLocal({ dbConnectionUrl })).toStrictEqual(true);
    });

    it('should return false for a config referring to a database not hosted locally', () => {
      expect.assertions(1);

      const dbConnectionUrl = 'mongodb+srv://root:password@somewhere.intheworld.com/forest';

      expect(Dumper.isDatabaseLocal({ dbConnectionUrl })).toStrictEqual(false);
    });
  });

  describe('isLocalUrl', () => {
    it('should return true for a local url', () => {
      expect.assertions(1);

      expect(Dumper.isLocalUrl('http://localhost')).toStrictEqual(true);
    });

    it('should return false for not local url', () => {
      expect.assertions(1);

      expect(Dumper.isLocalUrl('http://somewhere.else.intheworld.com')).toStrictEqual(false);
    });
  });

  describe('getPort', () => {
    it('should return the given for config containing appPort', () => {
      expect.assertions(1);

      expect(Dumper.getPort({ appPort: 1234 })).toStrictEqual(1234);
    });

    it('should return the default port for config not containing appPort', () => {
      expect.assertions(1);

      expect(Dumper.getPort({})).toStrictEqual(3310);
    });
  });

  describe('getApplicationUrl', () => {
    describe('when no protocol is specified', () => {
      it('should prefix the host name with http://', () => {
        expect.assertions(1);

        expect(Dumper.getApplicationUrl({ appHostname: 'somewhere.not.local.com' })).toStrictEqual('http://somewhere.not.local.com');
      });
    });

    describe('when https? protocol is specified', () => {
      it('should append the port to the given hostname for local application url', () => {
        expect.assertions(1);

        expect(Dumper.getApplicationUrl({
          appHostname: 'http://localhost',
          appPort: 1234,
        })).toStrictEqual('http://localhost:1234');
      });

      it('should return the appHostname already defined', () => {
        expect.assertions(1);

        expect(Dumper.getApplicationUrl({
          appHostname: 'https://somewhere.com',
        })).toStrictEqual('https://somewhere.com');
      });
    });
  });

  describe('writeDotEnv', () => {
    const config = {
      dbConnectionUrl: 'mongodb://root:password@localhost:27017/forest',
      ssl: true,
      appHostname: 'localhost',
      forestEnvSecret: 'someEnvSecret',
      forestAuthSecret: 'someAuthSecret',
    };

    describe('on a linux based os', () => {
      it('should compute the handlebars context from the given config with no dockerDatabaseUrl', () => {
        expect.assertions(2);

        const dumper = createDumper();
        const copyHandlebarsTemplateSpy = jest.spyOn(dumper, 'copyHandleBarsTemplate').mockImplementation();
        jest.spyOn(dumper, 'isLinuxBasedOs').mockReturnValue(true);
        dumper.writeDotEnv(ABSOLUTE_PROJECT_PATH, config);

        expect(copyHandlebarsTemplateSpy).toHaveBeenCalledTimes(1);
        expect(copyHandlebarsTemplateSpy).toHaveBeenCalledWith({
          projectPath: ABSOLUTE_PROJECT_PATH,
          source: 'app/env.hbs',
          target: '.env',
          context: {
            databaseUrl: config.dbConnectionUrl,
            ssl: config.ssl,
            dbSchema: undefined,
            hostname: config.appHostname,
            port: 3310,
            forestEnvSecret: config.forestEnvSecret,
            forestAuthSecret: config.forestAuthSecret,
            hasDockerDatabaseUrl: false,
            applicationUrl: 'http://localhost:3310',
          },
        });
      });
    });

    describe('on a non-linux based os', () => {
      it('should compute the handlebars context from the given config with a dockerDatabaseUrl', () => {
        expect.assertions(2);

        const dumper = createDumper();
        const copyHandlebarsTemplateSpy = jest.spyOn(dumper, 'copyHandleBarsTemplate').mockImplementation();
        jest.spyOn(dumper, 'isLinuxBasedOs').mockReturnValue(false);
        dumper.writeDotEnv(ABSOLUTE_PROJECT_PATH, config);

        expect(copyHandlebarsTemplateSpy).toHaveBeenCalledTimes(1);
        expect(copyHandlebarsTemplateSpy).toHaveBeenCalledWith({
          projectPath: ABSOLUTE_PROJECT_PATH,
          source: 'app/env.hbs',
          target: '.env',
          context: {
            databaseUrl: config.dbConnectionUrl,
            ssl: config.ssl,
            dbSchema: undefined,
            dockerDatabaseUrl: 'mongodb://root:password@host.docker.internal:27017/forest',
            hostname: config.appHostname,
            port: 3310,
            forestEnvSecret: config.forestEnvSecret,
            forestAuthSecret: config.forestAuthSecret,
            hasDockerDatabaseUrl: true,
            applicationUrl: 'http://localhost:3310',
          },
        });
      });
    });
  });

  describe('writeDockerfile', () => {
    it('should call the copyHandleBarsTemplate with an empty context', () => {
      expect.assertions(1);

      const dumper = createDumper();
      const copyHandlebarsTemplateSpy = jest.spyOn(dumper, 'copyHandleBarsTemplate').mockImplementation();
      dumper.writeDockerfile(ABSOLUTE_PROJECT_PATH, { dbDialect: 'mongodb' });

      expect(copyHandlebarsTemplateSpy).toHaveBeenCalledWith({
        projectPath: ABSOLUTE_PROJECT_PATH,
        source: 'app/Dockerfile.hbs',
        target: 'Dockerfile',
        context: {},
      });
    });
  });

  describe('writeDockerCompose', () => {
    describe('when an environment variable FOREST_URL is provided', () => {
      it('should have called copyHandlebarsTemplate with a valid forestUrl is context', () => {
        expect.assertions(1);

        const dumper = createDumper({
          env: {
            FOREST_URL: 'https://something.com',
          },
        });
        jest.spyOn(dumper, 'isLinuxBasedOs').mockReturnValue(true);
        const copyHandlebarsTemplateSpy = jest.spyOn(dumper, 'copyHandleBarsTemplate').mockImplementation();
        dumper.writeDockerCompose(ABSOLUTE_PROJECT_PATH, {});
        const handlebarContext = copyHandlebarsTemplateSpy.mock.calls[0][0].context;

        // eslint-disable-next-line no-template-curly-in-string
        expect(handlebarContext.forestUrl).toStrictEqual('${FOREST_URL-https://something.com}');
      });
    });

    describe('when no environment variable FOREST_URL is provided', () => {
      it('should have called copyHandlebarsTemplate with a valid forestUrl is context', () => {
        expect.assertions(1);

        const dumper = createDumper({
          env: {
            FOREST_URL: DEFAULT_FOREST_URL,
          },
        });
        jest.spyOn(dumper, 'isLinuxBasedOs').mockReturnValue(true);
        const copyHandlebarsTemplateSpy = jest.spyOn(dumper, 'copyHandleBarsTemplate').mockImplementation();
        dumper.writeDockerCompose(ABSOLUTE_PROJECT_PATH, {});
        const handlebarContext = copyHandlebarsTemplateSpy.mock.calls[0][0].context;

        expect(handlebarContext.forestUrl).toStrictEqual(false);
      });
    });
  });

  describe('writeForestAdminMiddleware', () => {
    describe('on mongodb', () => {
      it('should compute the handlebars context', () => {
        expect.assertions(1);

        const dumper = createDumper();
        const copyHandlebarsTemplateSpy = jest.spyOn(dumper, 'copyHandleBarsTemplate').mockImplementation();
        dumper.writeForestAdminMiddleware(ABSOLUTE_PROJECT_PATH, { dbDialect: 'mongodb' });

        expect(copyHandlebarsTemplateSpy).toHaveBeenCalledWith({
          projectPath: ABSOLUTE_PROJECT_PATH,
          source: 'app/middlewares/forestadmin.hbs',
          target: 'middlewares/forestadmin.js',
          context: { isMongoDB: true },
        });
      });
    });

    describe('on sql based DBS', () => {
      it('should compute the handlebars context', () => {
        expect.assertions(1);

        const dumper = createDumper();
        const copyHandlebarsTemplateSpy = jest.spyOn(dumper, 'copyHandleBarsTemplate').mockImplementation();
        dumper.writeForestAdminMiddleware(ABSOLUTE_PROJECT_PATH, { dbDialect: 'mysql' });

        expect(copyHandlebarsTemplateSpy).toHaveBeenCalledWith({
          projectPath: ABSOLUTE_PROJECT_PATH,
          source: 'app/middlewares/forestadmin.hbs',
          target: 'middlewares/forestadmin.js',
          context: { isMongoDB: false },
        });
      });
    });
  });

  describe('dump', () => {
    it('should call all the mandatory functions required to generate a complete project', async () => {
      expect.assertions(27);

      const mkdirpMock = jest.fn();
      const dumper = createDumper({
        os: {
          platform: () => jest.fn().mockReturnValue('linux'),
        },
        mkdirp: mkdirpMock,
      });
      const writeForestCollectionSpy = jest.spyOn(dumper, 'writeForestCollection').mockImplementation();
      const writeForestAdminMiddlewareSpy = jest.spyOn(dumper, 'writeForestAdminMiddleware').mockImplementation();
      const writeModelsIndexSpy = jest.spyOn(dumper, 'writeModelsIndex').mockImplementation();
      const writeModelSpy = jest.spyOn(dumper, 'writeModel').mockImplementation();
      const writeRouteSpy = jest.spyOn(dumper, 'writeRoute').mockImplementation();
      const writeDotEnvSpy = jest.spyOn(dumper, 'writeDotEnv').mockImplementation();
      const writeAppJsSpy = jest.spyOn(dumper, 'writeAppJs').mockImplementation();
      const writeDatabasesConfigSpy = jest.spyOn(dumper, 'writeDatabasesConfig').mockImplementation();
      const writeDockerComposeSpy = jest.spyOn(dumper, 'writeDockerCompose').mockImplementation();
      const writeDockerfileSpy = jest.spyOn(dumper, 'writeDockerfile').mockImplementation();
      const writePackageJsonSpy = jest.spyOn(dumper, 'writePackageJson').mockImplementation();
      const copyTemplateSpy = jest.spyOn(dumper, 'copyTemplate').mockImplementation();

      const schema = {
        testModel: { fields: {}, references: [], options: {} },
      };
      const config = {
        appName: 'test-output/unit-test-dumper',
      };
      await dumper.dump(schema, config);

      const projectPath = `${process.cwd()}/test-output/unit-test-dumper`;

      expect(mkdirpMock).toHaveBeenCalledTimes(8);
      expect(mkdirpMock).toHaveBeenCalledWith(projectPath);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/routes`);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/forest`);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/models`);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/config`);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/public`);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/views`);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/middlewares`);

      // Files associated with each models of the schema
      expect(writeModelSpy).toHaveBeenCalledWith(projectPath, config, 'testModel', {}, [], {});
      expect(writeRouteSpy).toHaveBeenCalledWith(projectPath, config, 'testModel');
      expect(writeForestCollectionSpy).toHaveBeenCalledWith(projectPath, config, 'testModel');

      // General app files, based on config
      expect(writeForestAdminMiddlewareSpy).toHaveBeenCalledWith(projectPath, config);
      expect(writeModelsIndexSpy).toHaveBeenCalledWith(projectPath, config);
      expect(writeDotEnvSpy).toHaveBeenCalledWith(projectPath, config);
      expect(writeDatabasesConfigSpy).toHaveBeenCalledWith(projectPath, config);
      expect(writeAppJsSpy).toHaveBeenCalledWith(projectPath, config);
      expect(writeDockerComposeSpy).toHaveBeenCalledWith(projectPath, config);
      expect(writeDockerfileSpy).toHaveBeenCalledWith(projectPath);
      expect(writePackageJsonSpy).toHaveBeenCalledWith(projectPath, config);

      // Copied files
      expect(copyTemplateSpy).toHaveBeenCalledTimes(6);
      expect(copyTemplateSpy).toHaveBeenCalledWith(projectPath, 'middlewares/welcome.hbs', 'middlewares/welcome.js');
      expect(copyTemplateSpy).toHaveBeenCalledWith(projectPath, 'public/favicon.png', 'public/favicon.png');
      expect(copyTemplateSpy).toHaveBeenCalledWith(projectPath, 'views/index.hbs', 'views/index.html');
      expect(copyTemplateSpy).toHaveBeenCalledWith(projectPath, 'dockerignore.hbs', '.dockerignore');
      expect(copyTemplateSpy).toHaveBeenCalledWith(projectPath, 'gitignore.hbs', '.gitignore');
      expect(copyTemplateSpy).toHaveBeenCalledWith(projectPath, 'server.hbs', 'server.js');
    });

    it('should call all the mandatory functions required to update project', async () => {
      expect.assertions(18);

      const mkdirpMock = jest.fn();
      const dumper = createDumper({
        os: {
          platform: () => jest.fn().mockReturnValue('linux'),
        },
        mkdirp: mkdirpMock,
      });
      const writeForestCollectionSpy = jest.spyOn(dumper, 'writeForestCollection').mockImplementation();
      const writeForestAdminMiddlewareSpy = jest.spyOn(dumper, 'writeForestAdminMiddleware').mockImplementation();
      const writeModelsIndexSpy = jest.spyOn(dumper, 'writeModelsIndex').mockImplementation();
      const writeModelSpy = jest.spyOn(dumper, 'writeModel').mockImplementation();
      const writeRouteSpy = jest.spyOn(dumper, 'writeRoute').mockImplementation();
      const writeDotEnvSpy = jest.spyOn(dumper, 'writeDotEnv').mockImplementation();
      const writeAppJsSpy = jest.spyOn(dumper, 'writeAppJs').mockImplementation();
      const writeDatabasesConfigSpy = jest.spyOn(dumper, 'writeDatabasesConfig').mockImplementation();
      const writeDockerComposeSpy = jest.spyOn(dumper, 'writeDockerCompose').mockImplementation();
      const writeDockerfileSpy = jest.spyOn(dumper, 'writeDockerfile').mockImplementation();
      const writePackageJsonSpy = jest.spyOn(dumper, 'writePackageJson').mockImplementation();
      const copyTemplateSpy = jest.spyOn(dumper, 'copyTemplate').mockImplementation();

      const schema = {
        testModel: { fields: {}, references: [], options: {} },
      };
      const config = {
        isUpdate: true,
        useMultiDatabase: true,
        modelsExportPath: 'test',
      };
      await dumper.dump(schema, config);

      const projectPath = process.cwd();

      expect(mkdirpMock).toHaveBeenCalledTimes(5);
      expect(mkdirpMock).toHaveBeenCalledWith(projectPath);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/routes`);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/forest`);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/models`);
      expect(mkdirpMock).toHaveBeenCalledWith(`${projectPath}/models/test`);

      // Files associated with each models of the schema
      expect(writeModelSpy).toHaveBeenCalledWith(projectPath, config, 'testModel', {}, [], {});
      expect(writeRouteSpy).toHaveBeenCalledWith(projectPath, config, 'testModel');
      expect(writeForestCollectionSpy).toHaveBeenCalledWith(projectPath, config, 'testModel');

      // General app files, based on config
      expect(writeForestAdminMiddlewareSpy).not.toHaveBeenCalled();
      expect(writeModelsIndexSpy).not.toHaveBeenCalled();
      expect(writeDotEnvSpy).not.toHaveBeenCalled();
      expect(writeDatabasesConfigSpy).not.toHaveBeenCalled();
      expect(writeAppJsSpy).not.toHaveBeenCalled();
      expect(writeDockerComposeSpy).not.toHaveBeenCalled();
      expect(writeDockerfileSpy).not.toHaveBeenCalled();
      expect(writePackageJsonSpy).not.toHaveBeenCalled();

      // Copied files
      expect(copyTemplateSpy).not.toHaveBeenCalled();
    });
  });

  describe('checkLumberProjectStructure', () => {
    it('should not throw an error when structure is correct', () => {
      expect.assertions(1);

      const dumper = createDumper({
        fs: {
          existsSync: jest.fn().mockReturnValue(true),
        },
      });

      expect(() => dumper.checkLumberProjectStructure()).not.toThrow();
    });

    it('should throw an error when missing routes folder', () => {
      expect.assertions(1);

      const dumper = createDumper({
        fs: {
          existsSync: jest.fn().mockImplementation((path) => !path.includes('routes')),
        },
      });

      expect(() => dumper.checkLumberProjectStructure())
        .toThrow(InvalidLumberProjectStructureError);
    });

    it('should throw an error when missing forest folder', () => {
      expect.assertions(1);

      const dumper = createDumper({
        fs: {
          existsSync: jest.fn().mockImplementation((path) => !path.includes('forest')),
        },
      });

      expect(() => dumper.checkLumberProjectStructure())
        .toThrow(InvalidLumberProjectStructureError);
    });

    it('should throw an error when missing models folder', () => {
      expect.assertions(1);

      const dumper = createDumper({
        fs: {
          existsSync: jest.fn().mockImplementation((path) => !path.includes('models')),
        },
      });

      expect(() => dumper.checkLumberProjectStructure())
        .toThrow(InvalidLumberProjectStructureError);
    });
  });

  describe('checkLianaCompatiblityForUpdate', () => {
    it('should not throw an error when liana is compatible', () => {
      expect.assertions(1);

      const dumper = createDumper({
        fs: {
          existsSync: jest.fn().mockReturnValue(true),
          readFileSync: jest.fn().mockReturnValue('forest-express-sequelize: ^7.0.0,'),
        },
      });

      expect(() => dumper.checkLianaCompatiblityForUpdate()).not.toThrow();
    });

    it('should throw an error when package.json does not exist', () => {
      expect.assertions(1);

      const dumper = createDumper({
        fs: {
          existsSync: jest.fn().mockReturnValue(false),
        },
      });

      const packagePath = `${process.cwd()}/package.json`;
      expect(() => dumper.checkLianaCompatiblityForUpdate())
        .toThrow(new IncompatibleLianaForUpdateError(`"${packagePath}" not found.`));
    });

    it('should throw an error when liana version is less than 7', () => {
      expect.assertions(1);

      const dumper = createDumper({
        fs: {
          existsSync: jest.fn().mockReturnValue(true),
          readFileSync: jest.fn().mockReturnValue('forest-express-sequelize: ^6.0.0,'),
        },
      });

      expect(() => dumper.checkLianaCompatiblityForUpdate())
        .toThrow(new IncompatibleLianaForUpdateError(
          'Your project is not compatible with the `lumber update` command. You need to use an agent version greater than 7.0.0.',
        ));
    });

    it('should throw an error when liana version is not found on package.json', () => {
      expect.assertions(1);

      const dumper = createDumper({
        fs: {
          existsSync: jest.fn().mockReturnValue(true),
          readFileSync: jest.fn().mockReturnValue(''),
        },
      });

      expect(() => dumper.checkLianaCompatiblityForUpdate())
        .toThrow(new IncompatibleLianaForUpdateError(
          'Your project is not compatible with the `lumber update` command. You need to use an agent version greater than 7.0.0.',
        ));
    });
  });

  describe('hasMultipleDatabaseStructure', () => {
    it('should return false if models folder contains some js files', () => {
      expect.assertions(1);

      const mockedFiles = [{
        name: 'index.js',
        isFile: () => true,
      }, {
        name: 'user.js',
        isFile: () => true,
      }, {
        name: 'databaseFolder',
        isFile: () => false,
      }];

      const dumper = createDumper({
        fs: {
          readdirSync: jest.fn().mockReturnValue(mockedFiles),
        },
      });

      expect(dumper.hasMultipleDatabaseStructure()).toStrictEqual(false);
    });

    it('should return true if models folder contains only subfolders', () => {
      expect.assertions(1);

      const mockedFiles = [{
        name: 'index.js',
        isFile: () => true,
      }, {
        name: 'databaseFolder',
        isFile: () => false,
      }];

      const dumper = createDumper({
        fs: {
          readdirSync: jest.fn().mockReturnValue(mockedFiles),
        },
      });

      expect(dumper.hasMultipleDatabaseStructure()).toStrictEqual(true);
    });
  });
});

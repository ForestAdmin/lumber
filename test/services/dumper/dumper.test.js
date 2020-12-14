const fs = require('fs');
const sinon = require('sinon');
const os = require('os');
const rimraf = require('rimraf');
const Dumper = require('../../../services/dumper');

const DOCKER_COMPOSE_FILE_LOCATION = './test-output/Linux/docker-compose.yml';
const DOT_ENV_FILE_LOCATION = './test-output/Linux/.env';

function cleanOutput() {
  rimraf.sync('./test-output/mysql');
}

/**
 * @param {{
 *   dbConnectionUrl?: string;
 *   appHostname?: string;
 *   appPort?: number;
 * }} [overrides]
 */
async function createLinuxDump(overrides = {}) {
  const config = {
    appName: 'test-output/Linux',
    dbDialect: 'mysql',
    dbConnectionUrl: 'mysql://localhost:8999',
    ssl: false,
    dbSchema: 'public',
    appHostname: 'localhost',
    appPort: 1654,
    ...overrides,
  };

  const dumper = new Dumper(config);
  await dumper.dump({});
}

describe('services > dumper', () => {
  describe('on a linux based OS', () => {
    describe('when the database is on the local machine', () => {
      let osStub;

      // eslint-disable-next-line jest/no-hooks
      beforeAll(() => {
        osStub = sinon.stub(os, 'platform');
        osStub.returns('linux');
      });

      // eslint-disable-next-line jest/no-hooks
      afterAll(() => {
        osStub.restore();
      });

      it('should not make use of `host.docker.internal`', async () => {
        expect.assertions(2);

        await createLinuxDump();

        const dockerComposeFile = fs.readFileSync(DOCKER_COMPOSE_FILE_LOCATION, 'utf-8');
        const dotEnvFile = fs.readFileSync(DOT_ENV_FILE_LOCATION, 'utf-8');

        expect(dockerComposeFile).not.toContain('host.docker.internal');
        expect(dotEnvFile).not.toContain('host.docker.internal');

        cleanOutput();
      });

      describe('when the database is local on the system', () => {
        it('should use `network` option set to `host` in the docker-compose file', async () => {
          expect.assertions(1);

          await createLinuxDump();

          const dockerComposeFile = fs.readFileSync(DOCKER_COMPOSE_FILE_LOCATION, 'utf-8');
          expect(dockerComposeFile).toContain('network: host');

          cleanOutput();
        });
      });

      describe('when the database is not local on the system', () => {
        it('should not use `network` option in the docker-compose file', async () => {
          expect.assertions(1);

          await createLinuxDump({ dbConnectionUrl: 'mysql://example.com:8999' });

          const dockerComposeFile = fs.readFileSync(DOCKER_COMPOSE_FILE_LOCATION, 'utf-8');
          expect(dockerComposeFile).not.toContain('network');

          cleanOutput();
        });
      });
    });
  });

  describe('generation of APPLICATION_URL', () => {
    /**
     * @param {{appHostname?: string; appPort?: number}} overrides
     */
    async function generateEnvFile(overrides) {
      await createLinuxDump(overrides);

      return fs.readFileSync(DOT_ENV_FILE_LOCATION, 'utf-8');
    }

    describe('with an external application url', () => {
      it('should generate an APPLICATION_URL without the port number', async () => {
        expect.assertions(1);
        try {
          const dotEnvFile = await generateEnvFile({
            appHostname: 'agent.forestadmin.com',
          });

          expect(dotEnvFile).toContain('APPLICATION_URL=http://agent.forestadmin.com');
        } finally {
          cleanOutput();
        }
      });

      it('should generate an APPLICATION_URL with the right protocol and without the port number', async () => {
        expect.assertions(1);

        try {
          const dotEnvFile = await generateEnvFile({
            appHostname: 'https://agent.forestadmin.com',
          });

          expect(dotEnvFile).toContain('APPLICATION_URL=https://agent.forestadmin.com');
        } finally {
          cleanOutput();
        }
      });
    });

    describe('with a local url', () => {
      it('should append the port number to the url', async () => {
        expect.assertions(1);

        try {
          const dotEnvFile = await generateEnvFile({
            appHostname: 'http://localhost',
            appPort: 3333,
          });

          expect(dotEnvFile).toContain('APPLICATION_URL=http://localhost:3333');
        } finally {
          cleanOutput();
        }
      });

      it('should add the protocol and append the port number', async () => {
        expect.assertions(1);

        try {
          const dotEnvFile = await generateEnvFile({
            appHostname: 'localhost',
            appPort: 3333,
          });

          expect(dotEnvFile).toContain('APPLICATION_URL=http://localhost:3333');
        } finally {
          cleanOutput();
        }
      });
    });
  });

  describe('getDatabaseUrl', () => {
    it('should return the connection string if no dbConnectionUrl is provided', () => {
      expect.assertions(1);

      const config = {
        dbDialect: 'mysql',
        dbPort: 3306,
        dbUser: 'root',
        dbPassword: 'password',
        dbHostname: 'localhost',
        dbName: 'forest',
      };

      const dumper = new Dumper(config);
      const databaseUrl = dumper.getDatabaseUrl();

      expect(databaseUrl).toStrictEqual('mysql://root:password@localhost:3306/forest');
    });

    it('should remove the port if mongodbSrv is provided', () => {
      expect.assertions(1);

      const config = {
        dbDialect: 'mongodb',
        dbPort: 3306,
        mongodbSrv: true,
        dbUser: 'root',
        dbPassword: 'password',
        dbHostname: 'localhost',
        dbName: 'forest',
      };

      const dumper = new Dumper(config);
      const databaseUrl = dumper.getDatabaseUrl();

      expect(databaseUrl).toStrictEqual('mongodb+srv://root:password@localhost/forest');
    });
  });
});

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

async function createLinuxDump(isDatabaseLocal = true) {
  const config = {
    appName: 'test-output/Linux',
    dbDialect: 'mysql',
    dbConnectionUrl: isDatabaseLocal ? 'mysql://localhost:8999' : 'mysql://example.com:8999',
    ssl: false,
    dbSchema: 'public',
    appHostname: 'localhost',
    appPort: 1654,
  };

  const dumper = await new Dumper(config);
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

          await createLinuxDump(false);

          const dockerComposeFile = fs.readFileSync(DOCKER_COMPOSE_FILE_LOCATION, 'utf-8');
          expect(dockerComposeFile).not.toContain('network');

          cleanOutput();
        });
      });
    });
  });
});

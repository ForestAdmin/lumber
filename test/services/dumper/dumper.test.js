const fs = require('fs');
const sinon = require('sinon');
const os = require('os');
const rimraf = require('rimraf');
const Dumper = require('../../../services/dumper');

function cleanOutput() {
  rimraf.sync('./test-output/mysql');
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

        const config = {
          appName: 'test-output/Linux',
          dbDialect: 'mysql',
          dbConnectionUrl: 'mysql://localhost:8999',
          ssl: false,
          dbSchema: 'public',
          appHostname: 'localhost',
          appPort: 1654,
        };

        await new Dumper(config);
        const dockerComposeFile = fs.readFileSync('./test-output/mysql/docker-compose.yml', 'utf-8');
        const dotEnvFile = fs.readFileSync('./test-output/mysql/.env', 'utf-8');

        expect(dockerComposeFile).not.toContain('host.docker.internal');
        expect(dotEnvFile).not.toContain('host.docker.internal');

        cleanOutput();
      });

      it('should use `network` option set to `host` in the docker-compose file', async () => {
        expect.assertions(1);

        async function dump() {
          const config = {
            appName: 'test-output/mysql',
            dbDialect: 'mysql',
            dbConnectionUrl: 'mysql://localhost:8999',
            ssl: false,
            dbSchema: 'public',
            appHostname: 'localhost',
            appPort: 1654,
          };

          const dumper = await new Dumper(config);
          await dumper.dump({});
        }

        await dump();

        const dockerComposeFile = fs.readFileSync('./test-output/mysql/docker-compose.yml', 'utf-8');
        expect(dockerComposeFile).toContain('network: host');

        cleanOutput();
      });
    });
  });
});

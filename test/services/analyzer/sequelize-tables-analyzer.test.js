const analyzeSequelizeTables = require('../../../services/analyzer/sequelize-tables-analyzer');
const { databaseAnalyzerErrors } = require('../../../utils/errors');

describe('services > sequelizeTablesAnalyzer', () => {
  describe('analyzeSequelizeTables', () => {
    it('should return an EmptyDatabase error if connection doesn\'t have tables', async () => {
      expect.assertions(1);

      const databaseConnectionMock = {
        getQueryInterface: jest.fn().mockReturnValue({
          showAllTables: jest.fn().mockResolvedValue([]),
        }),
        getDialect: jest.fn().mockReturnValue('mysql'),
      };

      const error = new databaseAnalyzerErrors.EmptyDatabase('no tables found');

      await expect(analyzeSequelizeTables(databaseConnectionMock, {})).rejects.toThrow(error);
    });
  });
});

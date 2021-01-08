const analyzeMongoCollections = require('../../../services/analyzer/mongo-collections-analyzer');
const EmptyDatabaseError = require('../../../utils/errors/database/empty-database-error');

describe('services > mongoCollectionsAnalyzer', () => {
  describe('analyzeMongoCollections', () => {
    it('should return an EmptyDatabase error if connection doesn\'t have collections', async () => {
      expect.assertions(1);

      const databaseConnectionMock = {
        collections: jest.fn().mockResolvedValue([]),
      };

      const error = new EmptyDatabaseError('no collections found');

      await expect(analyzeMongoCollections(databaseConnectionMock)).rejects.toThrow(error);
    });
  });
});

const analyzeMongoCollections = require('../../../services/analyzer/mongo-collections-analyzer');
const { databaseAnalyzerErrors } = require('../../../utils/errors');

describe('services > mongoCollectionsAnalyzer', () => {
  describe('analyzeMongoCollections', () => {
    it('should return an EmptyDatabase error if connection doesn\'t have collections', async () => {
      expect.assertions(1);

      const databaseConnectionMock = {
        collections: jest.fn().mockResolvedValue([]),
      };

      const error = new databaseAnalyzerErrors.EmptyDatabase('no collections found');

      await expect(analyzeMongoCollections(databaseConnectionMock)).rejects.toThrow(error);
    });
  });
});

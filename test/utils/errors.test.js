const LumberError = require('../../utils/lumber-error');
const EmptyDatabaseError = require('../../utils/errors/database/empty-database-error');

describe('utils > errors', () => {
  describe('lumberError', () => {
    it('should be an instance of Error', () => {
      expect.assertions(1);

      const error = new LumberError();

      expect(error).toBeInstanceOf(Error);
    });

    it('should handle the details of an error', () => {
      expect.assertions(1);

      const error = new LumberError('an error', 'a detail');

      expect(error.details).toStrictEqual('a detail');
    });
  });

  describe('databaseAnalyzerErrors', () => {
    it('emptyDatabase should be of type LumberError', () => {
      expect.assertions(1);

      const error = new EmptyDatabaseError();

      expect(error).toBeInstanceOf(LumberError);
    });
  });
});

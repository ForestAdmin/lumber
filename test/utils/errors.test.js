const { LumberError, databaseAnalyzerErrors } = require('../../utils/errors');

describe('errors', () => {
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

      const error = new databaseAnalyzerErrors.EmptyDatabase();

      expect(error).toBeInstanceOf(LumberError);
    });
  });
});

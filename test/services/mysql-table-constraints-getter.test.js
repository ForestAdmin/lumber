const MysqlTableConstraintsGetter = require('../../services/analyzer/mysql-table-constraints-getter');

const databaseConnectionMock = {
  getQueryInterface: () => {
  },
};

describe('services > mysql table constraints getter', () => {
  describe('with no unique index', () => {
    it('should provide an empty unique constraint array', async () => {
      expect.assertions(1);
      const fixture = [
        { columnType: 'BLABLA', constraintName: 'FOOFOO1' },
        { columnType: 'BLABLA', constraintName: 'FOOFOO2' },
        { columnType: 'BLABLA', constraintName: 'FOOFOO3' },
      ];
      const tested = new MysqlTableConstraintsGetter(databaseConnectionMock);
      const actual = tested.convertToUniqueIndexArray(fixture);
      const expected = [];

      expect(actual).toStrictEqual(expected);
    });
  });
  describe('with two simple unique indexes', () => {
    it('should provide an unique constraint array', async () => {
      expect.assertions(1);
      const fixture = [
        { columnType: 'BLABLA', constraintName: 'FOOFOO1' },
        { columnType: 'UNIQUE', constraintName: 'FOOFOO2', columnName: 'one' },
        { columnType: 'BLABLA', constraintName: 'FOOFOO3' },
        { columnType: 'UNIQUE', constraintName: 'FOOFOO4', columnName: 'anotherOne' },
      ];
      const tested = new MysqlTableConstraintsGetter(databaseConnectionMock);
      const actual = tested.convertToUniqueIndexArray(fixture);
      const expected = [['one'], ['anotherOne']];

      expect(actual).toStrictEqual(expected);
    });
  });
  describe('with two unique indexes', () => {
    it('should provide an unique constraint array', async () => {
      expect.assertions(1);
      const fixture = [
        { columnType: 'BLABLA', constraintName: 'FOOFOO1' },
        { columnType: 'UNIQUE', constraintName: 'FOOFOO2', columnName: 'left' },
        { columnType: 'BLABLA', constraintName: 'FOOFOO3' },
        { columnType: 'UNIQUE', constraintName: 'FOOFOO4', columnName: 'right' },
        { columnType: 'UNIQUE', constraintName: 'FOOFOO4', columnName: 'up' },
      ];
      const tested = new MysqlTableConstraintsGetter(databaseConnectionMock);
      const actual = tested.convertToUniqueIndexArray(fixture);
      const expected = [['left'], ['right', 'up']];

      expect(actual).toStrictEqual(expected);
    });
  });
});

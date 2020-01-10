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
        { columnType: 'PRIMARY_KEY', constraintName: 'PRIMARY' },
        { columnType: 'FOREIGN_KEY', constraintName: 'test_fkey' },
        { columnType: 'FOREIGN_KEY', constraintName: 'test_fkey' },
      ];
      const constraintGetter = new MysqlTableConstraintsGetter(databaseConnectionMock);
      const actual = constraintGetter.convertToUniqueIndexArray(fixture);

      expect(actual).toBeNull();
    });
  });
  describe('with two simple unique indexes', () => {
    it('should provide an unique constraint array', async () => {
      expect.assertions(1);
      const fixture = [
        { columnType: 'PRIMARY_KEY', constraintName: 'PRIMARY' },
        { columnType: 'UNIQUE', constraintName: 'one_unique_index', columnName: 'one' },
        { columnType: 'FOREIGN_KEY', constraintName: 'test_fkey' },
        { columnType: 'UNIQUE', constraintName: 'anotherOne_unique_index', columnName: 'anotherOne' },
      ];
      const constraintGetter = new MysqlTableConstraintsGetter(databaseConnectionMock);
      const actual = constraintGetter.convertToUniqueIndexArray(fixture);
      const expected = [['one'], ['anotherOne']];

      expect(actual).toStrictEqual(expected);
    });
  });
  describe('with two unique indexes', () => {
    it('should provide an unique constraint array', async () => {
      expect.assertions(1);
      const fixture = [
        { columnType: 'PRIMARY_KEY', constraintName: 'PRIMARY' },
        { columnType: 'UNIQUE', constraintName: 'left_unique_index', columnName: 'left' },
        { columnType: 'FOREIGN_KEY', constraintName: 'test_fkey' },
        { columnType: 'UNIQUE', constraintName: 'right_up_unique_index', columnName: 'right' },
        { columnType: 'UNIQUE', constraintName: 'right_up_unique_index', columnName: 'up' },
      ];
      const constraintGetter = new MysqlTableConstraintsGetter(databaseConnectionMock);
      const actual = constraintGetter.convertToUniqueIndexArray(fixture);
      const expected = [['left'], ['right', 'up']];

      expect(actual).toStrictEqual(expected);
    });
  });
});

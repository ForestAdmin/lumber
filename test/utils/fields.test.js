const { isUnderscored } = require('../../utils/fields');

describe('utils > fields', () => {
  describe('without wrong parameters', () => {
    it('should return false', () => {
      expect.assertions(2);

      expect(isUnderscored(undefined)).toStrictEqual(false);
      expect(isUnderscored([])).toStrictEqual(false);
    });
  });

  describe('with only one field named `id`', () => {
    it('should return true', () => {
      expect.assertions(1);

      const fields = [{
        nameColumn: 'id',
      }];

      expect(isUnderscored(fields)).toStrictEqual(true);
    });
  });

  describe('with multiple fields', () => {
    describe('with underscored fields', () => {
      it('should return true', () => {
        expect.assertions(1);

        const fields = [{
          nameColumn: 'id',
        }, {
          nameColumn: 'first_name',
        }];

        expect(isUnderscored(fields)).toStrictEqual(true);
      });
    });

    describe('without underscored fields', () => {
      it('should return false', () => {
        expect.assertions(1);

        const fields = [{
          nameColumn: 'id',
        }, {
          nameColumn: 'firstName',
        }];

        expect(isUnderscored(fields)).toStrictEqual(false);
      });
    });
  });
});

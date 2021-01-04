const { isUnderscored } = require('../../utils/fields');

describe('utils > fields', () => {
  describe('without parameters', () => {
    it('should return false', () => {
      expect.assertions(1);
      expect(isUnderscored(undefined)).toStrictEqual(false);
    });
  });

  describe('with an empty field array', () => {
    it('should return false', () => {
      expect.assertions(1);
      expect(isUnderscored([])).toStrictEqual(false);
    });
  });

  describe('with only one field', () => {
    describe('when the field is named `id`', () => {
      it('should return true', () => {
        expect.assertions(1);

        const fields = [{
          nameColumn: 'id',
        }];

        expect(isUnderscored(fields)).toStrictEqual(true);
      });
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
      it('should return true', () => {
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

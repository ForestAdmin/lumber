const { ObjectId } = require('mongodb');
const { getMongooseTypeFromValue, isOfMongooseType } = require('../../utils/mongo-primitive-type');

describe('utils > Mongo Primitive Type', () => {
  describe('get primitive type from value', () => {
    it('should return `String`', () => {
      expect.assertions(1);
      expect(getMongooseTypeFromValue('string')).toStrictEqual('String');
    });

    it('should return `Number`', () => {
      expect.assertions(1);
      expect(getMongooseTypeFromValue(1)).toStrictEqual('Number');
    });

    it('should return `Boolean`', () => {
      expect.assertions(2);
      expect(getMongooseTypeFromValue(true)).toStrictEqual('Boolean');
      expect(getMongooseTypeFromValue(false)).toStrictEqual('Boolean');
    });

    it('should return `Date`', () => {
      expect.assertions(1);
      expect(getMongooseTypeFromValue(new Date())).toStrictEqual('Date');
    });

    it('should return `Mongoose.Schema.Types.ObjectId`', () => {
      expect.assertions(1);
      expect(getMongooseTypeFromValue(new ObjectId('objectIdFake'))).toStrictEqual('Mongoose.Schema.Types.ObjectId');
    });

    it('should return null', () => {
      expect.assertions(4);
      expect(getMongooseTypeFromValue(null)).toBeNull();
      expect(getMongooseTypeFromValue(undefined)).toBeNull();
      expect(getMongooseTypeFromValue([])).toBeNull();
      expect(getMongooseTypeFromValue({})).toBeNull();
    });
  });

  describe('checking if value is has a primitive type', () => {
    it('should return true', () => {
      expect.assertions(5);
      expect(isOfMongooseType('string')).toStrictEqual(true);
      expect(isOfMongooseType(1)).toStrictEqual(true);
      expect(isOfMongooseType(true)).toStrictEqual(true);
      expect(isOfMongooseType(new Date())).toStrictEqual(true);
      expect(isOfMongooseType(new ObjectId('objectIdFake'))).toStrictEqual(true);
    });

    it('should return false', () => {
      expect.assertions(4);
      expect(isOfMongooseType(undefined)).toStrictEqual(false);
      expect(isOfMongooseType(null)).toStrictEqual(false);
      expect(isOfMongooseType([])).toStrictEqual(false);
      expect(isOfMongooseType({})).toStrictEqual(false);
    });
  });
});

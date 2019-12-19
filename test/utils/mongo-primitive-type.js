const { expect } = require('chai');
const { ObjectId } = require('mongodb');
const { getMongooseTypeFromValue, isOfMongooseType } = require('../../utils/mongo-primitive-type');

describe('Utils > Mongo Primitive Type', () => {
  describe('Get primitive type from value', () => {
    it('Should return `String`', () => {
      expect(getMongooseTypeFromValue('string')).to.equal('String');
    });

    it('Should return `Number`', () => {
      expect(getMongooseTypeFromValue(1)).to.equal('Number');
    });

    it('Should return `Boolean`', () => {
      expect(getMongooseTypeFromValue(true)).to.equal('Boolean');
      expect(getMongooseTypeFromValue(false)).to.equal('Boolean');
    });

    it('Should return `Date`', () => {
      expect(getMongooseTypeFromValue(new Date())).to.equal('Date');
    });

    it('Should return `mongoose.Schema.Types.ObjectId`', () => {
      expect(getMongooseTypeFromValue(new ObjectId('objectIdFake'))).to.equal('mongoose.Schema.Types.ObjectId');
    });

    it('Should return null', () => {
      expect(getMongooseTypeFromValue(null)).to.equal(null);
      expect(getMongooseTypeFromValue(undefined)).to.equal(null);
      expect(getMongooseTypeFromValue([])).to.equal(null);
      expect(getMongooseTypeFromValue({})).to.equal(null);
    });
  });

  describe('Checking if value is has a primitive type', () => {
    it('Should return true', () => {
      expect(isOfMongooseType('string')).to.equal(true);
      expect(isOfMongooseType(1)).to.equal(true);
      expect(isOfMongooseType(true)).to.equal(true);
      expect(isOfMongooseType(new Date())).to.equal(true);
      expect(isOfMongooseType(new ObjectId('objectIdFake'))).to.equal(true);
    });

    it('Should return false', () => {
      expect(isOfMongooseType(undefined)).to.equal(false);
      expect(isOfMongooseType(null)).to.equal(false);
      expect(isOfMongooseType([])).to.equal(false);
      expect(isOfMongooseType({})).to.equal(false);
    });
  });
});

const { expect } = require('chai');
const { ObjectId } = require('mongodb');
const { getPrimitiveType, isTypePrimitive } = require('../../utils/mongo-primitive-type');

describe('Utils > Mongo Primitive Type', () => {
  describe('Get primitive type from value', () => {
    it('Should return `String`', () => {
      expect(getPrimitiveType('string')).to.equal('String');
    });

    it('Should return `Number`', () => {
      expect(getPrimitiveType(1)).to.equal('Number');
    });

    it('Should return `Boolean`', () => {
      expect(getPrimitiveType(true)).to.equal('Boolean');
      expect(getPrimitiveType(false)).to.equal('Boolean');
    });

    it('Should return `Date`', () => {
      expect(getPrimitiveType(new Date())).to.equal('Date');
    });

    it('Should return `mongoose.Schema.Types.ObjectId`', () => {
      expect(getPrimitiveType(new ObjectId('objectIdFake'))).to.equal('mongoose.Schema.Types.ObjectId');
    });

    it('Should return undefined', () => {
      expect(getPrimitiveType(undefined)).to.equal(undefined);
      expect(getPrimitiveType([])).to.equal(undefined);
      expect(getPrimitiveType({})).to.equal(undefined);
    });
  });

  describe('Checking if value is has a primitive type', () => {
    it('Should return true', () => {
      expect(isTypePrimitive('string')).to.equal(true);
      expect(isTypePrimitive(1)).to.equal(true);
      expect(isTypePrimitive(true)).to.equal(true);
      expect(isTypePrimitive(new Date())).to.equal(true);
      expect(isTypePrimitive(new ObjectId('objectIdFake'))).to.equal(true);
    });

    it('Should return false', () => {
      expect(isTypePrimitive(undefined)).to.equal(false);
      expect(isTypePrimitive([])).to.equal(false);
      expect(isTypePrimitive({})).to.equal(false);
    });
  });
});

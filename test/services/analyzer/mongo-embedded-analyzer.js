const { expect } = require('chai');
const { ObjectId } = require('mongodb');
const {
  analyse,
  analyseArray,
  analysePrimitive,
  analyseEmbedded,
  hasEmbeddedTypes,
  haveSameEmbeddedType,
  areAnalysesSameEmbeddedType,
  serializeAnalysis,
  deserializeAnalyses,
  deserializeAnalysis,
} = require('../../../services/analyzer/mongo-embedded-analyzer');

describe('Services > Mongo Embedded Analyser', () => {
  describe('Analysing', () => {
    describe('Performing global analysis', () => {
      it('Should detect that the value to analyse is an array', () => {
        expect(analyse([1, 2, 3])).to.be.an.instanceOf(Array);
      });

      it('Should detect that the value to analyse is an object', () => {
        expect(analyse({ one: 1, two: 2 })).to.be.an.instanceOf(Object);
      });

      it('Should detect that the value to analyse is a primitive value', () => {
        expect(analyse('1')).to.equal('String');
        expect(analyse(1)).to.equal('Number');
        expect(analyse(true)).to.equal('Boolean');
        expect(analyse(new Date())).to.equal('Date');
        expect(analyse(new ObjectId('objectIdFake'))).to.equal('mongoose.Schema.Types.ObjectId');
      });
    });

    describe('Handling primitive types', () => {
      it('Should return null if value is not primitive', () => {
        expect(analyse({})).to.equal(null);
        expect(analyse([])).to.equal(null);
        expect(analyse(undefined)).to.equal(null);
        expect(analyse(null)).to.equal(null);
      });

      it('Should return the correct primitive type depending on the value', () => {
        expect(analyse('')).to.equal('String');
        expect(analyse('1')).to.equal('String');
        expect(analyse(1)).to.equal('Number');
        expect(analyse(NaN)).to.equal('Number');
        expect(analyse(1.11)).to.equal('Number');
        expect(analyse(true)).to.equal('Boolean');
        expect(analyse(false)).to.equal('Boolean');
        expect(analyse(new Date())).to.equal('Date');
        expect(analyse(new ObjectId('objectIdFake'))).to.equal('mongoose.Schema.Types.ObjectId');
      });
    });

    describe('Handling array types', () => {
      it('Should return null if array is empty, undefined, or not an array', () => {
        expect(analyseArray([])).to.equal(null);
        expect(analyseArray(undefined)).to.equal(null);
        expect(analyseArray({})).to.equal(null);
        expect(analyseArray('string')).to.equal(null);
      });

      it('Should return array of Primitive type if array contains primitive types', () => {
        const arrayOfStringTypeDetection = analyseArray(['one', 'two', 'three']);
        const arrayOfNumberTypeDetection = analyseArray([1, 2, 3]);
        const arrayOfBooleanTypeDetection = analyseArray([true, false, true]);
        const arrayOfDateTypeDetection = analyseArray([new Date(), new Date()]);
        const arrayOfObjectIdsTypeDetection = analyseArray([new ObjectId('objectIdFake'), new ObjectId('objectIdFake')]);

        expect(arrayOfStringTypeDetection).to.deep.equal(['String', 'String', 'String']);
        expect(arrayOfNumberTypeDetection).to.deep.equal(['Number', 'Number', 'Number']);
        expect(arrayOfBooleanTypeDetection).to.deep.equal(['Boolean', 'Boolean', 'Boolean']);
        expect(arrayOfDateTypeDetection).to.deep.equal(['Date', 'Date']);
        expect(arrayOfObjectIdsTypeDetection).to.deep.equal(['mongoose.Schema.Types.ObjectId', 'mongoose.Schema.Types.ObjectId']);
      });

      it('Should return an array of whole schema if array contains subDocuments', () => {
        const arrayOfSchemaTypeDetection = analyseArray([{ one: 1 }, { two: 2 }]);

        expect(typeof arrayOfSchemaTypeDetection === 'object').to.equal(true);
        expect(Array.isArray(arrayOfSchemaTypeDetection)).to.equal(true);
        expect(typeof arrayOfSchemaTypeDetection[0] === 'object').to.equal(true);
      });
    });

    describe('Handling embedded object', () => {
      it('Should return null if embedded object is empty or undefined', () => {
        let objectTypeDetection = analyseEmbedded({});
        expect(objectTypeDetection).to.equal(null);

        objectTypeDetection = analyseEmbedded(undefined);
        expect(objectTypeDetection).to.equal(null);
      });

      it('Should return an object with fields as key and Primitive Type as value', () => {
        const embeddedOfPrimitiveTypeDetection = analyseEmbedded({
          string: 'string',
          number: 1,
          boolean: true,
          date: new Date(),
          objectId: new ObjectId('objectIdFake'),
        });

        expect(typeof embeddedOfPrimitiveTypeDetection === 'object').to.equal(true);
        expect(embeddedOfPrimitiveTypeDetection.string).to.equal('String');
        expect(embeddedOfPrimitiveTypeDetection.number).to.equal('Number');
        expect(embeddedOfPrimitiveTypeDetection.boolean).to.equal('Boolean');
        expect(embeddedOfPrimitiveTypeDetection.date).to.equal('Date');
        expect(embeddedOfPrimitiveTypeDetection.objectId).to.equal('mongoose.Schema.Types.ObjectId');
      });

      it('Should return object with nested level as object', () => {
        const embeddedWithNestedDetection = analyseEmbedded({
          level_1: {
            string: 'string',
            level_2: {
              number: 2,
            },
          },
        });

        expect(typeof embeddedWithNestedDetection.level_1 === 'object').to.equal(true);
        expect(embeddedWithNestedDetection.level_1.string).to.equal('String');
        expect(typeof embeddedWithNestedDetection.level_1.level_2 === 'object').to.equal(true);
        expect(embeddedWithNestedDetection.level_1.level_2.number).to.equal('Number');
      });

      it('Should not handle `_id` keys', () => {
        const embeddedWithIdKey = {
          _id: ObjectId(),
          embeddedValue: {
            _id: ObjectId(),
            stringValue: 'my value',
          },
        };

        const analysis = analyseEmbedded(embeddedWithIdKey);

        // eslint-disable-next-line no-underscore-dangle
        expect(analysis._id).to.equal(undefined);
        expect(analysis.embeddedValue).to.be.an.instanceOf(Object);
        // eslint-disable-next-line no-underscore-dangle
        expect(analysis.embeddedValue._id).to.equal(undefined);
        expect(analysis.embeddedValue.stringValue).to.equal('String');
      });
    });
  });

  /* describe('Merging analyses'; () => {

  }); */

  describe('Utils', () => {
    describe('Checking if analyses array contains embedded types', () => {
      it('Should return true if at least one of the analyses contains embedded types', () => {
        const result = hasEmbeddedTypes([
          {
            type: 'String',
          },
          {
            type: 'embedded',
            detections: 'detections...',
          },
        ]);

        expect(result).to.equal(true);
      });

      it('Should return true if all the analyses are embedded analyses', () => {
        const result = hasEmbeddedTypes([
          {
            type: 'embedded',
            detections: 'detections',
          },
          {
            type: 'embedded',
            detections: 'detections...',
          },
        ]);

        expect(result).to.equal(true);
      });

      it('Should return false if all the analyses is undefined or empty', () => {
        let result = hasEmbeddedTypes(undefined);
        expect(result).to.equal(false);

        result = hasEmbeddedTypes([]);
        expect(result).to.equal(false);
      });

      it('Should return false if none of analyses are embedded analysis', () => {
        const result = hasEmbeddedTypes([
          {
            type: 'String',
          },
          {
            type: 'String',
          },
        ]);

        expect(result).to.equal(false);
      });
    });

    describe('Checking if two values have the same type', () => {
      it('Should return true ', () => {
        expect(haveSameEmbeddedType('value1', 'value2')).to.equal(true);
        expect(haveSameEmbeddedType(1, 2)).to.equal(true);
        expect(haveSameEmbeddedType(true, false)).to.equal(true);
        expect(haveSameEmbeddedType(new Date(), new Date())).to.equal(true);
        expect(haveSameEmbeddedType(new ObjectId('objectIdFake'), new ObjectId('objectIdFake'))).to.equal(true);
        expect(haveSameEmbeddedType({}, {})).to.equal(true);
        expect(haveSameEmbeddedType([], [])).to.equal(true);
      });

      it('Should return false', () => {
        expect(haveSameEmbeddedType({}, [])).to.equal(false);
        expect(haveSameEmbeddedType('1', 1)).to.equal(false);
      });
    });

    describe('Checking if every analysis have the same type', () => {
      it('Should return false if analyses is not an array, or an empty array', () => {
        expect(areAnalysesSameEmbeddedType([])).to.equal(false);
        expect(areAnalysesSameEmbeddedType(undefined)).to.equal(false);
        expect(areAnalysesSameEmbeddedType(null)).to.equal(false);
        expect(areAnalysesSameEmbeddedType('not an array')).to.equal(false);
        expect(areAnalysesSameEmbeddedType(true)).to.equal(false);
        expect(areAnalysesSameEmbeddedType(false)).to.equal(false);
        expect(areAnalysesSameEmbeddedType(0)).to.equal(false);
      });

      it('Should return true if analyses contains only one analysis', () => {
        expect(areAnalysesSameEmbeddedType([{}])).to.equal(true);
        expect(areAnalysesSameEmbeddedType(['String'])).to.equal(true);
        expect(areAnalysesSameEmbeddedType(['Number'])).to.equal(true);
      });

      it('Should return true if every analysis have the same type', () => {
        expect(areAnalysesSameEmbeddedType([[], []])).to.equal(true);
        expect(areAnalysesSameEmbeddedType([{ one: 1 }, { two: 2 }])).to.equal(true);
      });

      it('Should false if at least two analyses type mismatch', () => {
        expect(areAnalysesSameEmbeddedType(['String', []])).to.equal(false);
        expect(areAnalysesSameEmbeddedType(['String', {}])).to.equal(false);
        expect(areAnalysesSameEmbeddedType([[], {}])).to.equal(false);
      });
    });
  });
});

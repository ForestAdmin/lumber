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
} = require('../../services/analyzer/mongo-embedded-analyzer');

describe('Services > Mongo Embedded Analyser', () => {
  describe('Analysing', () => {
    describe('Performing global analysis', () => {
      it('Should detect that the value to analyse is an array', () => {
        const analysis = analyse([1, 2, 3]);
        expect(analysis).to.be.an.instanceOf(Array);
      });

      it('Should detect that the value to analyse is an object', () => {
        const analysis = analyse({ one: 1, two: 2 });
        expect(analysis).to.be.an.instanceOf(Object);
      });

      it('Should detect that the value to analyse is a primitive value', () => {
        let analysis = analyse('1');
        expect(analysis).to.equal('String');

        analysis = analyse(1);
        expect(analysis).to.equal('Number');

        analysis = analyse(true);
        expect(analysis).to.equal('Boolean');

        analysis = analyse(new Date());
        expect(analysis).to.equal('Date');

        analysis = analyse(new ObjectId('objectIdFake'));
        expect(analysis).to.equal('mongoose.Schema.Types.ObjectId');
      });
    });

    describe('Handling primitive types', () => {
      it('Should return null if value is not primitive', () => {
        let analysis = analysePrimitive({});
        expect(analysis).to.equal(null);

        analysis = analysePrimitive([]);
        expect(analysis).to.equal(null);

        analysis = analysePrimitive(undefined);
        expect(analysis).to.equal(null);

        analysis = analysePrimitive(null);
        expect(analysis).to.equal(null);
      });

      it('Should return the correct primitive type depending on the value', () => {
        let analysis = analysePrimitive('1');
        expect(analysis).to.equal('String');

        analysis = analysePrimitive(1);
        expect(analysis).to.equal('Number');

        analysis = analysePrimitive(true);
        expect(analysis).to.equal('Boolean');

        analysis = analysePrimitive(new Date());
        expect(analysis).to.equal('Date');

        analysis = analysePrimitive(new ObjectId('objectIdFake'));
        expect(analysis).to.equal('mongoose.Schema.Types.ObjectId');
      });
    });

    describe('Handling array types', () => {
      it('Should return null if array is empty, undefined, or not an array', () => {
        let arrayTypeDetection = analyseArray([]);
        expect(arrayTypeDetection).to.equal(null);

        arrayTypeDetection = analyseArray(undefined);
        expect(arrayTypeDetection).to.equal(null);

        arrayTypeDetection = analyseArray({});
        expect(arrayTypeDetection).to.equal(null);

        arrayTypeDetection = analyseArray('string');
        expect(arrayTypeDetection).to.equal(null);
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
    });
  });

  /* describe('Merging analyses'; () => {

  }); */

  describe('Utils', () => {
    describe('Serializing analyses', () => {
      it('Should wrap analyses in a recognizable embedded object and compatible with mapReduce', () => {
        const fakeAnalyses = ['String', { one: 'Number' }, 'Boolean'];
        const wrappedAnalyses = serializeAnalysis(fakeAnalyses);

        expect(wrappedAnalyses).to.be.an.instanceOf(Object);
        expect(wrappedAnalyses.type).to.equal('embedded');
        expect(typeof wrappedAnalyses.schema).to.equal('string');
      });

      it('Should return null if nothing has to be serialized', () => {
        expect(serializeAnalysis(undefined)).to.equal(null);
        expect(serializeAnalysis(null)).to.equal(null);
      });
    });

    describe('Deserializing analysis', () => {
      it('Should deserialize to a single parsed analysis', () => {
        const stringifiedAnalysis = JSON.stringify([{ one: 'Number', array: ['Boolean'] }]);
        const serializedAnalysis = { type: 'embedded', schema: stringifiedAnalysis };

        const deserializedAnalysis = deserializeAnalysis(serializedAnalysis);

        expect(deserializedAnalysis).to.be.an.instanceOf(Object);
        expect(deserializedAnalysis.type).to.equal(undefined);
        expect(deserializedAnalysis.schema).to.equal(undefined);
      });

      it('Should return null if nothing has to be deserialized', () => {
        expect(deserializeAnalysis(undefined)).to.equal(null);
        expect(deserializeAnalysis(null)).to.equal(null);
      });
    });

    describe('Deserializing fields analysis', () => {
      it('Should only deserialize embedded analysis and leave simple analyses as they are', () => {
        const stringifiedEmbeddedAnalysis = JSON.stringify([{ one: 'Number', array: ['Boolean'] }]);
        const notEmbeddedAnalysis = 'String';
        const serializedAnalyses = [
          { type: 'embedded', schema: stringifiedEmbeddedAnalysis },
          notEmbeddedAnalysis,
        ];

        const deserializedAnalyses = deserializeAnalyses(serializedAnalyses);

        expect(deserializedAnalyses[0]).to.be.an.instanceOf(Object);
        expect(deserializedAnalyses[1]).to.equal('String');
      });

      it('Should deserialize to a multiple parsed analysis', () => {
        const stringifiedAnalyses = JSON.stringify([
          {
            one: 'Number', array: ['Boolean'],
          },
          {
            one: 'Number', array: ['Boolean'],
          },
        ]);
        const serializedAnalyses = [{ type: 'embedded', schema: stringifiedAnalyses }];

        const deserializedAnalyses = deserializeAnalyses(serializedAnalyses);

        expect(deserializedAnalyses).to.be.an.instanceOf(Array);
        expect(deserializedAnalyses.length).to.equal(1);
        expect(deserializedAnalyses[0]).to.be.an.instanceOf(Object);
        expect(deserializedAnalyses.type).to.equal(undefined);
        expect(deserializedAnalyses.schema).to.equal(undefined);
      });

      it('Should return null if nothing has to be deserialized', () => {
        expect(deserializeAnalysis(undefined)).to.equal(null);
        expect(deserializeAnalysis(null)).to.equal(null);
      });
    });

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
      it('Should return true if analyses are empty', () => {
        expect(areAnalysesSameEmbeddedType([])).to.equal(true);
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

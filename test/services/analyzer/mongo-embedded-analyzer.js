const { expect } = require('chai');
const { ObjectId } = require('mongodb');
const {
  addMongooseType,
  addNestedSchemaToParentSchema,
  addObjectSchema,
  areAnalysesSameEmbeddedType,
  areSchemaTypesMixed,
  getMongooseSchema,
  getMongooseArraySchema,
  getMongooseEmbeddedSchema,
  hasEmbeddedTypes,
  haveSameEmbeddedType,
  mergeAnalyzedSchemas,
} = require('../../../services/analyzer/mongo-embedded-analyzer');

describe('Services > Mongo Embedded Analyser', () => {
  describe('Analysing', () => {
    describe('Performing global analysis', () => {
      it('Should detect that the value to analyse is an array', () => {
        expect(getMongooseSchema([1, 2, 3])).to.be.an.instanceOf(Array);
      });

      it('Should detect that the value to analyse is an object', () => {
        expect(getMongooseSchema({ one: 1, two: 2 })).to.be.an.instanceOf(Object);
      });

      it('Should detect that the value to analyse is a primitive value', () => {
        expect(getMongooseSchema('1')).to.equal('String');
        expect(getMongooseSchema(1)).to.equal('Number');
        expect(getMongooseSchema(true)).to.equal('Boolean');
        expect(getMongooseSchema(new Date())).to.equal('Date');
        expect(getMongooseSchema(new ObjectId('objectIdFake'))).to.equal('mongoose.Schema.Types.ObjectId');
      });
    });

    describe('Handling primitive types', () => {
      it('Should return null if value is not primitive', () => {
        expect(getMongooseSchema({})).to.equal(null);
        expect(getMongooseSchema([])).to.equal(null);
        expect(getMongooseSchema(undefined)).to.equal(null);
        expect(getMongooseSchema(null)).to.equal(null);
      });

      it('Should return the correct primitive type depending on the value', () => {
        expect(getMongooseSchema('')).to.equal('String');
        expect(getMongooseSchema('1')).to.equal('String');
        expect(getMongooseSchema(1)).to.equal('Number');
        expect(getMongooseSchema(NaN)).to.equal('Number');
        expect(getMongooseSchema(1.11)).to.equal('Number');
        expect(getMongooseSchema(true)).to.equal('Boolean');
        expect(getMongooseSchema(false)).to.equal('Boolean');
        expect(getMongooseSchema(new Date())).to.equal('Date');
        expect(getMongooseSchema(new ObjectId('objectIdFake'))).to.equal('mongoose.Schema.Types.ObjectId');
      });
    });

    describe('Handling array types', () => {
      it('Should return null if array is empty, undefined, or not an array', () => {
        expect(getMongooseArraySchema([])).to.equal(null);
        expect(getMongooseArraySchema(undefined)).to.equal(null);
        expect(getMongooseArraySchema({})).to.equal(null);
        expect(getMongooseArraySchema('string')).to.equal(null);
      });

      it('Should return array of Primitive type if array contains primitive types', () => {
        const arrayOfStringTypeDetection = getMongooseArraySchema(['one', 'two', 'three']);
        const arrayOfNumberTypeDetection = getMongooseArraySchema([1, 2, 3]);
        const arrayOfBooleanTypeDetection = getMongooseArraySchema([true, false, true]);
        const arrayOfDateTypeDetection = getMongooseArraySchema([new Date(), new Date()]);
        const arrayOfObjectIdsTypeDetection = getMongooseArraySchema([new ObjectId('objectIdFake'), new ObjectId('objectIdFake')]);

        expect(arrayOfStringTypeDetection).to.deep.equal(['String', 'String', 'String']);
        expect(arrayOfNumberTypeDetection).to.deep.equal(['Number', 'Number', 'Number']);
        expect(arrayOfBooleanTypeDetection).to.deep.equal(['Boolean', 'Boolean', 'Boolean']);
        expect(arrayOfDateTypeDetection).to.deep.equal(['Date', 'Date']);
        expect(arrayOfObjectIdsTypeDetection).to.deep.equal(['mongoose.Schema.Types.ObjectId', 'mongoose.Schema.Types.ObjectId']);
      });

      it('Should return an array of whole schema if array contains subDocuments', () => {
        const arrayOfSchemaTypeDetection = getMongooseArraySchema([{ one: 1 }, { two: 2 }]);

        expect(typeof arrayOfSchemaTypeDetection === 'object').to.equal(true);
        expect(Array.isArray(arrayOfSchemaTypeDetection)).to.equal(true);
        expect(typeof arrayOfSchemaTypeDetection[0] === 'object').to.equal(true);
      });
    });

    describe('Handling embedded object', () => {
      it('Should return null if embedded object is empty or undefined', () => {
        let objectTypeDetection = getMongooseEmbeddedSchema({});
        expect(objectTypeDetection).to.equal(null);

        objectTypeDetection = getMongooseEmbeddedSchema(undefined);
        expect(objectTypeDetection).to.equal(null);
      });

      it('Should return an object with fields as key and Primitive Type as value', () => {
        const embeddedOfPrimitiveTypeDetection = getMongooseEmbeddedSchema({
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
        const embeddedWithNestedDetection = getMongooseEmbeddedSchema({
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

        const analysis = getMongooseEmbeddedSchema(embeddedWithIdKey);

        // eslint-disable-next-line no-underscore-dangle
        expect(analysis._id).to.equal(undefined);
        expect(analysis.embeddedValue).to.be.an.instanceOf(Object);
        // eslint-disable-next-line no-underscore-dangle
        expect(analysis.embeddedValue._id).to.equal(undefined);
        expect(analysis.embeddedValue.stringValue).to.equal('String');
      });
    });
  });

  describe('Merging schemas analysed into one schema', () => {
    describe('When merging a record top key schema', () => {
      it('Should return `mongoose.Mixed` if type from analyses are different', () => {
        const multipleDifferentAnalyses = ['String', ['Number'], { key: 'Boolean' }];
        expect(mergeAnalyzedSchemas(multipleDifferentAnalyses)).to.equal('mongoose.Mixed');
      });

      it('Should return an array as global key type', () => {
        const oneAnalysis = [['String']];
        expect(mergeAnalyzedSchemas(oneAnalysis)).to.be.an.instanceOf(Array);

        const multipleAnalyses = [['String'], [{ nestedKey: 'Number' }]];
        expect(mergeAnalyzedSchemas(multipleAnalyses)).to.be.an.instanceOf(Array);
      });

      it('Should return an object as global key type', () => {
        const oneAnalysis = [{ nestedKey: 'String' }];
        expect(mergeAnalyzedSchemas(oneAnalysis)).to.be.an.instanceOf(Object);

        const multipleAnalyses = [{ nestedKey: 'String' }, { nestedKey: 'Number' }];
        expect(mergeAnalyzedSchemas(multipleAnalyses)).to.be.an.instanceOf(Object);
      });
    });

    describe('When adding a nested key schema to record top key schema', () => {
      it('Should add an array as nested Key type', () => {
        const type = ['String', 'String'];
        const keySchema = { };
        const nestedKey = 'nestedKey';
        addNestedSchemaToParentSchema(type, keySchema, nestedKey);
        expect(keySchema[nestedKey]).to.be.an.instanceOf(Array);
      });

      it('Should add an object as nested Key type', () => {
        const type = [{ nestedKeyLevel2: 'String' }, { nestedKeyLevel2: 'Number' }];
        const keySchema = { };
        const nestedKey = 'nestedKey';
        addNestedSchemaToParentSchema(type, keySchema, nestedKey);
        expect(keySchema[nestedKey]).to.be.an.instanceOf(Object);
      });

      it('Should add a mongoose type as nested Key key', () => {
        const type = 'String';
        const keySchema = { };
        const nestedKey = 'nestedKey';
        addNestedSchemaToParentSchema(type, keySchema, nestedKey);
        expect(keySchema[nestedKey]).to.equal('String');
      });
    });

    describe('If the type to add is of mongoose type', () => {
      describe('If there is already a key with a type set in schema', () => {
        it('Should set the type to `mongoose.mixed` if types are different', () => {
          const parentSchema = { myKey: 'Number' };
          const type = 'String';
          const currentKey = 'myKey';

          addMongooseType(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).to.equals('mongoose.Mixed');
        });

        it('Should not change the type if types are the same one', () => {
          const parentSchema = { myKey: 'String' };
          const type = 'String';
          const currentKey = 'myKey';

          addMongooseType(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).to.equals('String');
        });
      });

      describe('If there is not any key in the schema', () => {
        it('Should add the type of the specific key in schema', () => {
          const parentSchema = {};
          const type = 'String';
          const currentKey = 'myKey';

          addMongooseType(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).to.equals('String');
        });
      });
    });

    describe('If the type to add is an embedded object', () => {
      describe('If there is already a key with a type set in schema', () => {
        it('Should set the type to `mongoose.mixed` if types are different', () => {
          const parentSchema = { myKey: 'Number' };
          const type = { nestedKey: 'String' };
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).to.equals('mongoose.Mixed');
        });

        it('Should not change the type if the set one is an object', () => {
          const parentSchema = { myKey: { nestedKey: 'String' } };
          const type = { nestedKey2: 'String' };
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).to.be.an.instanceOf(Object);
        });

        it('Should merge the current object set with the new one', () => {
          const parentSchema = { myKey: { nestedKey: 'String' } };
          const type = { nestedKey2: 'Number' };
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema).to.deep.equal({ myKey: { nestedKey: 'String', nestedKey2: 'Number' } });
        });
      });

      describe('If there is not any type in schema for a given key', () => {
        it('Should add the whole nested schema in the specified key in parent schema', () => {
          const parentSchema = {};
          const type = { nestedKey: 'String' };
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema).to.deep.equals({ myKey: { nestedKey: 'String' } });
        });
      });
    });

    describe('If the type to add is an array', () => {
      describe('If there is already a key with a type set in schema', () => {
        it('Should set the type to `mongoose.mixed` if types are different', () => {
          const parentSchema = { myKey: 'Number' };
          const type = ['String'];
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).to.equals('mongoose.Mixed');
        });

        it('Should not change the type if the set one is an array', () => {
          const parentSchema = { myKey: ['Number'] };
          const type = ['String'];
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).to.be.an.instanceOf(Array);
        });

        it('Should update the array value type according to the new one', () => {
          const parentSchema = { myKey: ['Number'] };
          const type = ['String'];
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema).to.deep.equal({ myKey: ['mongoose.Mixed'] });
        });
      });

      describe('If there is not any type in schema for a given key', () => {
        it('Should add the array in the specified key in parent schema', () => {
          const parentSchema = {};
          const type = ['String'];
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema).to.deep.equals({ myKey: ['String'] });
        });
      });
    });
  });

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

    describe('Checking if two types are mixed', () => {
      describe('If one at least one type is mixed', () => {
        it('Should return true in any case', () => {
          expect(areSchemaTypesMixed('mongoose.Mixed', 'mongoose.Mixed')).to.equal(true);
          expect(areSchemaTypesMixed('mongoose.Mixed', null)).to.equal(true);
          expect(areSchemaTypesMixed(null, 'mongoose.Mixed')).to.equal(true);
          expect(areSchemaTypesMixed('mongoose.Mixed', {})).to.equal(true);
          expect(areSchemaTypesMixed('mongoose.Mixed', [])).to.equal(true);
          expect(areSchemaTypesMixed('mongoose.Mixed', 'String')).to.equal(true);
        });
      });

      describe('If no types are mixed', () => {
        it('Should return false if at least one type is undefined or null', () => {
          expect(areSchemaTypesMixed(null, 'String')).to.equal(false);
          expect(areSchemaTypesMixed('String', null)).to.equal(false);
          expect(areSchemaTypesMixed(undefined, 'String')).to.equal(false);
          expect(areSchemaTypesMixed('String', undefined)).to.equal(false);
          expect(areSchemaTypesMixed(undefined, undefined)).to.equal(false);
          expect(areSchemaTypesMixed(null, null)).to.equal(false);
        });

        it('Should return true if types are different and different', () => {
          expect(areSchemaTypesMixed('String', 'Number')).to.equal(true);
          expect(areSchemaTypesMixed('Date', 'mongoose.Mixed')).to.equal(true);
          expect(areSchemaTypesMixed([], {})).to.equal(true);
          expect(areSchemaTypesMixed({}, 'String')).to.equal(true);
          expect(areSchemaTypesMixed('mongoose.Schema.Types.ObjectId', 'String')).to.equal(true);
        });
      });
    });
  });
});

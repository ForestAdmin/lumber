const { ObjectId } = require('mongodb');
const {
  addMongooseType,
  addNestedSchemaToParentSchema,
  addObjectSchema,
  areAnalysesSameEmbeddedType,
  areSchemaTypesMixed,
  detectSubDocumentsIdUsage,
  getMongooseSchema,
  getMongooseArraySchema,
  getMongooseEmbeddedSchema,
  hasEmbeddedTypes,
  haveSameEmbeddedType,
  mergeAnalyzedSchemas,
} = require('../../../services/analyzer/mongo-embedded-analyzer');

const MONGOOSE_SCHEMA_TYPE_OBJECTID = 'Mongoose.Schema.Types.ObjectId';

describe('services > Mongo Embedded Analyser', () => {
  describe('analysing', () => {
    describe('performing global analysis', () => {
      it('should detect that the value to analyse is an array', () => {
        expect.assertions(1);
        expect(getMongooseSchema([1, 2, 3])).toBeInstanceOf(Array);
      });

      it('should detect that the value to analyse is an object', () => {
        expect.assertions(1);
        expect(getMongooseSchema({ one: 1, two: 2 })).toBeInstanceOf(Object);
      });

      it('should detect that the value to analyse is a primitive value', () => {
        expect.assertions(5);
        expect(getMongooseSchema('1')).toStrictEqual('String');
        expect(getMongooseSchema(1)).toStrictEqual('Number');
        expect(getMongooseSchema(true)).toStrictEqual('Boolean');
        expect(getMongooseSchema(new Date())).toStrictEqual('Date');
        expect(getMongooseSchema(new ObjectId('objectIdFake'))).toStrictEqual(MONGOOSE_SCHEMA_TYPE_OBJECTID);
      });
    });

    describe('handling primitive types', () => {
      it('should return null if value is not primitive', () => {
        expect.assertions(4);
        expect(getMongooseSchema({})).toBeNull();
        expect(getMongooseSchema([])).toBeNull();
        expect(getMongooseSchema(undefined)).toBeNull();
        expect(getMongooseSchema(null)).toBeNull();
      });

      it('should return the correct primitive type depending on the value', () => {
        expect.assertions(9);
        expect(getMongooseSchema('')).toStrictEqual('String');
        expect(getMongooseSchema('1')).toStrictEqual('String');
        expect(getMongooseSchema(1)).toStrictEqual('Number');
        expect(getMongooseSchema(NaN)).toStrictEqual('Number');
        expect(getMongooseSchema(1.11)).toStrictEqual('Number');
        expect(getMongooseSchema(true)).toStrictEqual('Boolean');
        expect(getMongooseSchema(false)).toStrictEqual('Boolean');
        expect(getMongooseSchema(new Date())).toStrictEqual('Date');
        expect(getMongooseSchema(new ObjectId('objectIdFake'))).toStrictEqual(MONGOOSE_SCHEMA_TYPE_OBJECTID);
      });
    });

    describe('handling array types', () => {
      it('should return null if array is empty, undefined, or not an array', () => {
        expect.assertions(4);
        expect(getMongooseArraySchema([])).toBeNull();
        expect(getMongooseArraySchema(undefined)).toBeNull();
        expect(getMongooseArraySchema({})).toBeNull();
        expect(getMongooseArraySchema('string')).toBeNull();
      });

      it('should return array of Primitive type if array contains primitive types', () => {
        expect.assertions(5);
        const arrayOfStringTypeDetection = getMongooseArraySchema(['one', 'two', 'three']);
        const arrayOfNumberTypeDetection = getMongooseArraySchema([1, 2, 3]);
        const arrayOfBooleanTypeDetection = getMongooseArraySchema([true, false, true]);
        const arrayOfDateTypeDetection = getMongooseArraySchema([new Date(), new Date()]);
        const arrayOfObjectIdsTypeDetection = getMongooseArraySchema([new ObjectId('objectIdFake'), new ObjectId('objectIdFake')]);

        expect(arrayOfStringTypeDetection).toStrictEqual(['String', 'String', 'String']);
        expect(arrayOfNumberTypeDetection).toStrictEqual(['Number', 'Number', 'Number']);
        expect(arrayOfBooleanTypeDetection).toStrictEqual(['Boolean', 'Boolean', 'Boolean']);
        expect(arrayOfDateTypeDetection).toStrictEqual(['Date', 'Date']);
        expect(arrayOfObjectIdsTypeDetection)
          .toStrictEqual([MONGOOSE_SCHEMA_TYPE_OBJECTID, MONGOOSE_SCHEMA_TYPE_OBJECTID]);
      });

      it('should return an array of whole schema if array contains subDocuments', () => {
        expect.assertions(3);
        const arrayOfSchemaTypeDetection = getMongooseArraySchema([{ one: 1 }, { two: 2 }]);

        expect(typeof arrayOfSchemaTypeDetection === 'object').toStrictEqual(true);
        expect(Array.isArray(arrayOfSchemaTypeDetection)).toStrictEqual(true);
        expect(typeof arrayOfSchemaTypeDetection[0] === 'object').toStrictEqual(true);
      });

      it('should handle the _id fields for subDocuments in array', () => {
        expect.assertions(1);
        const arrayOfSchemaUsingIds = getMongooseArraySchema([{ _id: new ObjectId() }]);

        expect(arrayOfSchemaUsingIds[0]._id).toBeDefined();
      });
    });

    describe('handling embedded object', () => {
      it('should return null if embedded object is empty or undefined', () => {
        expect.assertions(2);
        let objectTypeDetection = getMongooseEmbeddedSchema({});
        expect(objectTypeDetection).toBeNull();

        objectTypeDetection = getMongooseEmbeddedSchema(undefined);
        expect(objectTypeDetection).toBeNull();
      });

      it('should return an object with fields as key and Primitive Type as value', () => {
        expect.assertions(6);
        const embeddedOfPrimitiveTypeDetection = getMongooseEmbeddedSchema({
          string: 'string',
          number: 1,
          boolean: true,
          date: new Date(),
          objectId: new ObjectId('objectIdFake'),
        });

        expect(typeof embeddedOfPrimitiveTypeDetection === 'object').toStrictEqual(true);
        expect(embeddedOfPrimitiveTypeDetection.string).toStrictEqual('String');
        expect(embeddedOfPrimitiveTypeDetection.number).toStrictEqual('Number');
        expect(embeddedOfPrimitiveTypeDetection.boolean).toStrictEqual('Boolean');
        expect(embeddedOfPrimitiveTypeDetection.date).toStrictEqual('Date');
        expect(embeddedOfPrimitiveTypeDetection.objectId)
          .toStrictEqual(MONGOOSE_SCHEMA_TYPE_OBJECTID);
      });

      it('should return object with nested level as object', () => {
        expect.assertions(4);
        const embeddedWithNestedDetection = getMongooseEmbeddedSchema({
          level_1: {
            string: 'string',
            level_2: {
              number: 2,
            },
          },
        });

        expect(typeof embeddedWithNestedDetection.level_1 === 'object').toStrictEqual(true);
        expect(embeddedWithNestedDetection.level_1.string).toStrictEqual('String');
        expect(typeof embeddedWithNestedDetection.level_1.level_2 === 'object').toStrictEqual(true);
        expect(embeddedWithNestedDetection.level_1.level_2.number).toStrictEqual('Number');
      });

      it('should not handle `_id` keys if not explicitly requested to', () => {
        expect.assertions(4);
        const embeddedWithIdKey = {
          _id: ObjectId(),
          embeddedValue: {
            _id: ObjectId(),
            stringValue: 'my value',
          },
        };

        const analysis = getMongooseEmbeddedSchema(embeddedWithIdKey);

        expect(analysis._id).toBeUndefined();
        expect(analysis.embeddedValue).toBeInstanceOf(Object);
        expect(analysis.embeddedValue._id).toBeUndefined();
        expect(analysis.embeddedValue.stringValue).toStrictEqual('String');
      });

      it('should handle `_id` keys if explicitly requested to', () => {
        expect.assertions(4);
        const embeddedWithIdKey = {
          _id: ObjectId(),
          embeddedValue: {
            _id: ObjectId(),
            stringValue: 'my value',
          },
        };

        const analysis = getMongooseEmbeddedSchema(embeddedWithIdKey, true);

        expect(analysis._id).toStrictEqual(MONGOOSE_SCHEMA_TYPE_OBJECTID);
        expect(analysis.embeddedValue).toBeInstanceOf(Object);
        expect(analysis.embeddedValue._id).toBeUndefined();
        expect(analysis.embeddedValue.stringValue).toStrictEqual('String');
      });
    });
  });

  describe('merging schemas analysed into one schema', () => {
    describe('when merging a record top key schema', () => {
      it('should return `Object` if type from analyses are different', () => {
        expect.assertions(1);
        const multipleDifferentAnalyses = ['String', ['Number'], { key: 'Boolean' }];
        expect(mergeAnalyzedSchemas(multipleDifferentAnalyses)).toStrictEqual('Object');
      });

      it('should return an array as global key type', () => {
        expect.assertions(2);
        const oneAnalysis = [['String']];
        expect(mergeAnalyzedSchemas(oneAnalysis)).toBeInstanceOf(Array);

        const multipleAnalyses = [['String'], [{ nestedKey: 'Number' }]];
        expect(mergeAnalyzedSchemas(multipleAnalyses)).toBeInstanceOf(Array);
      });

      it('should return an object as global key type', () => {
        expect.assertions(2);
        const oneAnalysis = [{ nestedKey: 'String' }];
        expect(mergeAnalyzedSchemas(oneAnalysis)).toBeInstanceOf(Object);

        const multipleAnalyses = [{ nestedKey: 'String' }, { nestedKey: 'Number' }];
        expect(mergeAnalyzedSchemas(multipleAnalyses)).toBeInstanceOf(Object);
      });
    });

    describe('when adding a nested key schema to record top key schema', () => {
      it('should add an array as nested Key type', () => {
        expect.assertions(1);
        const type = ['String', 'String'];
        const keySchema = { };
        const nestedKey = 'nestedKey';
        addNestedSchemaToParentSchema(type, keySchema, nestedKey);
        expect(keySchema[nestedKey]).toBeInstanceOf(Array);
      });

      it('should add an object as nested Key type', () => {
        expect.assertions(1);
        const type = [{ nestedKeyLevel2: 'String' }, { nestedKeyLevel2: 'Number' }];
        const keySchema = { };
        const nestedKey = 'nestedKey';
        addNestedSchemaToParentSchema(type, keySchema, nestedKey);
        expect(keySchema[nestedKey]).toBeInstanceOf(Object);
      });

      it('should add a mongoose type as nested Key key', () => {
        expect.assertions(1);
        const type = 'String';
        const keySchema = { };
        const nestedKey = 'nestedKey';
        addNestedSchemaToParentSchema(type, keySchema, nestedKey);
        expect(keySchema[nestedKey]).toStrictEqual('String');
      });
    });

    describe('if the type to add is of mongoose type', () => {
      describe('if there is already a key with a type set in the schema', () => {
        it('should set the type to `Object` if those types are different', () => {
          expect.assertions(1);
          const parentSchema = { myKey: 'Number' };
          const type = 'String';
          const currentKey = 'myKey';

          addMongooseType(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).toStrictEqual('Object');
        });

        it('should not change the type if types are the same one', () => {
          expect.assertions(1);
          const parentSchema = { myKey: 'String' };
          const type = 'String';
          const currentKey = 'myKey';

          addMongooseType(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).toStrictEqual('String');
        });
      });

      describe('if there is not any key in the schema', () => {
        it('should add the type of the specific key in schema', () => {
          expect.assertions(1);
          const parentSchema = {};
          const type = 'String';
          const currentKey = 'myKey';

          addMongooseType(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).toStrictEqual('String');
        });
      });
    });

    describe('if the type to add is an embedded object', () => {
      describe('if there is already a key with a type set in schema', () => {
        it('should set the type to `Object` if types are different', () => {
          expect.assertions(1);
          const parentSchema = { myKey: 'Number' };
          const type = { nestedKey: 'String' };
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).toStrictEqual('Object');
        });

        it('should not change the type if the set one is an object', () => {
          expect.assertions(1);
          const parentSchema = { myKey: { nestedKey: 'String' } };
          const type = { nestedKey2: 'String' };
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).toBeInstanceOf(Object);
        });

        it('should merge the current object set with the new one', () => {
          expect.assertions(1);
          const parentSchema = { myKey: { nestedKey: 'String' } };
          const type = { nestedKey2: 'Number' };
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema).toStrictEqual({ myKey: { nestedKey: 'String', nestedKey2: 'Number' } });
        });
      });

      describe('if there is not any type in schema for a given key', () => {
        it('should add the whole nested schema in the specified key in parent schema', () => {
          expect.assertions(1);
          const parentSchema = {};
          const type = { nestedKey: 'String' };
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema).toStrictEqual({ myKey: { nestedKey: 'String' } });
        });
      });
    });

    describe('if the type to add is an array', () => {
      describe('if there is already a key with a type set in schema', () => {
        it('should set the type to `Object` if types are different', () => {
          expect.assertions(1);
          const parentSchema = { myKey: 'Number' };
          const type = ['String'];
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).toStrictEqual('Object');
        });

        it('should not change the type if the set one is an array', () => {
          expect.assertions(1);
          const parentSchema = { myKey: ['Number'] };
          const type = ['String'];
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema[currentKey]).toBeInstanceOf(Array);
        });

        it('should update the array value type according to the new one', () => {
          expect.assertions(1);
          const parentSchema = { myKey: ['Number'] };
          const type = ['String'];
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema).toStrictEqual({ myKey: ['Object'] });
        });

        describe('when handling _ids on subDocuments', () => {
          it('should detect that the _id usage is ambiguous', () => {
            expect.assertions(1);

            const parentSchema = { };
            const currentKey = 'myKey';
            const type = [{ _id: MONGOOSE_SCHEMA_TYPE_OBJECTID }, { noId: 'String' }];

            addObjectSchema(type, parentSchema, currentKey);

            expect(parentSchema[currentKey][0]._id).toStrictEqual('ambiguous');
          });

          it('should detect that no _ids are used', () => {
            expect.assertions(1);

            const parentSchema = { };
            const currentKey = 'myKey';
            const type = [{ noId: 'String' }, { noId: 'String' }];

            addObjectSchema(type, parentSchema, currentKey);

            expect(parentSchema[currentKey][0]._id).toStrictEqual(false);
          });

          it('should detect that _ids are used', () => {
            expect.assertions(1);

            const parentSchema = { };
            const currentKey = 'myKey';
            const type = [{
              _id: MONGOOSE_SCHEMA_TYPE_OBJECTID,
            }, {
              _id: MONGOOSE_SCHEMA_TYPE_OBJECTID,
            }];

            addObjectSchema(type, parentSchema, currentKey);

            expect(parentSchema[currentKey][0]._id).toStrictEqual(MONGOOSE_SCHEMA_TYPE_OBJECTID);
          });
        });
      });

      describe('if there is not any type in schema for a given key', () => {
        it('should add the array in the specified key in parent schema', () => {
          expect.assertions(1);
          const parentSchema = {};
          const type = ['String'];
          const currentKey = 'myKey';

          addObjectSchema(type, parentSchema, currentKey);

          expect(parentSchema).toStrictEqual({ myKey: ['String'] });
        });
      });
    });
  });

  describe('utils', () => {
    describe('checking if analyses array contains embedded types', () => {
      it('should return true if at least one of the analyses contains embedded types', () => {
        expect.assertions(1);
        const result = hasEmbeddedTypes([
          {
            type: 'String',
          },
          {
            type: 'embedded',
            detections: 'detections...',
          },
        ]);

        expect(result).toStrictEqual(true);
      });

      it('should return true if all the analyses are embedded analyses', () => {
        expect.assertions(1);
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

        expect(result).toStrictEqual(true);
      });

      it('should return false if all the analyses is undefined or empty', () => {
        expect.assertions(2);
        let result = hasEmbeddedTypes(undefined);
        expect(result).toStrictEqual(false);

        result = hasEmbeddedTypes([]);
        expect(result).toStrictEqual(false);
      });

      it('should return false if none of analyses are embedded analysis', () => {
        expect.assertions(1);
        const result = hasEmbeddedTypes([
          {
            type: 'String',
          },
          {
            type: 'String',
          },
        ]);

        expect(result).toStrictEqual(false);
      });
    });

    describe('checking if two values have the same type', () => {
      it('should return true', () => {
        expect.assertions(7);
        expect(haveSameEmbeddedType('value1', 'value2')).toStrictEqual(true);
        expect(haveSameEmbeddedType(1, 2)).toStrictEqual(true);
        expect(haveSameEmbeddedType(true, false)).toStrictEqual(true);
        expect(haveSameEmbeddedType(new Date(), new Date())).toStrictEqual(true);
        expect(haveSameEmbeddedType(new ObjectId('objectIdFake'), new ObjectId('objectIdFake'))).toStrictEqual(true);
        expect(haveSameEmbeddedType({}, {})).toStrictEqual(true);
        expect(haveSameEmbeddedType([], [])).toStrictEqual(true);
      });

      it('should return false', () => {
        expect.assertions(2);
        expect(haveSameEmbeddedType({}, [])).toStrictEqual(false);
        expect(haveSameEmbeddedType('1', 1)).toStrictEqual(false);
      });
    });

    describe('checking if every analysis have the same type', () => {
      it('should return false if analyses is not an array, or an empty array', () => {
        expect.assertions(7);
        expect(areAnalysesSameEmbeddedType([])).toStrictEqual(false);
        expect(areAnalysesSameEmbeddedType(undefined)).toStrictEqual(false);
        expect(areAnalysesSameEmbeddedType(null)).toStrictEqual(false);
        expect(areAnalysesSameEmbeddedType('not an array')).toStrictEqual(false);
        expect(areAnalysesSameEmbeddedType(true)).toStrictEqual(false);
        expect(areAnalysesSameEmbeddedType(false)).toStrictEqual(false);
        expect(areAnalysesSameEmbeddedType(0)).toStrictEqual(false);
      });

      it('should return true if analyses contains only one analysis', () => {
        expect.assertions(3);
        expect(areAnalysesSameEmbeddedType([{}])).toStrictEqual(true);
        expect(areAnalysesSameEmbeddedType(['String'])).toStrictEqual(true);
        expect(areAnalysesSameEmbeddedType(['Number'])).toStrictEqual(true);
      });

      it('should return true if every analysis have the same type', () => {
        expect.assertions(2);
        expect(areAnalysesSameEmbeddedType([[], []])).toStrictEqual(true);
        expect(areAnalysesSameEmbeddedType([{ one: 1 }, { two: 2 }])).toStrictEqual(true);
      });

      it('should false if at least two analyses type mismatch', () => {
        expect.assertions(3);
        expect(areAnalysesSameEmbeddedType(['String', []])).toStrictEqual(false);
        expect(areAnalysesSameEmbeddedType(['String', {}])).toStrictEqual(false);
        expect(areAnalysesSameEmbeddedType([[], {}])).toStrictEqual(false);
      });
    });

    describe('checking if two types are mixed', () => {
      describe('if one at least one type is mixed', () => {
        it('should return true in any case', () => {
          expect.assertions(6);
          expect(areSchemaTypesMixed('Object', 'Object')).toStrictEqual(true);
          expect(areSchemaTypesMixed('Object', null)).toStrictEqual(true);
          expect(areSchemaTypesMixed(null, 'Object')).toStrictEqual(true);
          expect(areSchemaTypesMixed('Object', {})).toStrictEqual(true);
          expect(areSchemaTypesMixed('Object', [])).toStrictEqual(true);
          expect(areSchemaTypesMixed('Object', 'String')).toStrictEqual(true);
        });
      });

      describe('if no types are mixed', () => {
        it('should return false if at least one type is undefined or null', () => {
          expect.assertions(6);
          expect(areSchemaTypesMixed(null, 'String')).toStrictEqual(false);
          expect(areSchemaTypesMixed('String', null)).toStrictEqual(false);
          expect(areSchemaTypesMixed(undefined, 'String')).toStrictEqual(false);
          expect(areSchemaTypesMixed('String', undefined)).toStrictEqual(false);
          expect(areSchemaTypesMixed(undefined, undefined)).toStrictEqual(false);
          expect(areSchemaTypesMixed(null, null)).toStrictEqual(false);
        });

        it('should return true if types are different and different', () => {
          expect.assertions(5);
          expect(areSchemaTypesMixed('String', 'Number')).toStrictEqual(true);
          expect(areSchemaTypesMixed('Date', 'Object')).toStrictEqual(true);
          expect(areSchemaTypesMixed([], {})).toStrictEqual(true);
          expect(areSchemaTypesMixed({}, 'String')).toStrictEqual(true);
          expect(areSchemaTypesMixed(MONGOOSE_SCHEMA_TYPE_OBJECTID, 'String')).toStrictEqual(true);
        });
      });
    });

    describe('checking the usage of _id between two subDocuments', () => {
      it('should return `ambiguous` if at least one subDoc already has ambiguous _id', () => {
        expect.assertions(3);

        const alReadyAmbiguous = { _id: 'ambiguous' };
        let result;

        result = detectSubDocumentsIdUsage(alReadyAmbiguous, { });
        expect(result).toStrictEqual('ambiguous');

        result = detectSubDocumentsIdUsage({ }, alReadyAmbiguous);
        expect(result).toStrictEqual('ambiguous');

        result = detectSubDocumentsIdUsage(alReadyAmbiguous, alReadyAmbiguous);
        expect(result).toStrictEqual('ambiguous');
      });

      it('should return `ambiguous` if we can not decide whether the _id should be used', () => {
        expect.assertions(2);

        const usingId = { _id: MONGOOSE_SCHEMA_TYPE_OBJECTID };
        const notUsingId = { };
        let result;

        result = detectSubDocumentsIdUsage(usingId, notUsingId);
        expect(result).toStrictEqual('ambiguous');

        result = detectSubDocumentsIdUsage(notUsingId, usingId);
        expect(result).toStrictEqual('ambiguous');
      });

      it('should return true if we can assert that _id is used', () => {
        expect.assertions(1);

        const usingId = { _id: MONGOOSE_SCHEMA_TYPE_OBJECTID };

        expect(detectSubDocumentsIdUsage(usingId, usingId)).toStrictEqual(true);
      });

      it('should return false if we can assert that _id is not used', () => {
        expect.assertions(1);

        const notUsingId = { };

        expect(detectSubDocumentsIdUsage(notUsingId, notUsingId)).toStrictEqual(false);
      });
    });
  });
});

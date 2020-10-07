const {
  getMongooseTypeFromValue,
  isOfMongooseType,
} = require('../../utils/mongo-primitive-type');

/* eslint-disable vars-on-top, no-var, no-use-before-define, no-param-reassign */
/* istanbul ignore next */
function getMongooseEmbeddedSchema(embeddedObject, handleId = false) {
  if (!embeddedObject) {
    return null;
  }

  const schema = {};
  var keysToAnalyse = Object.keys(embeddedObject);

  if (!handleId) {
    keysToAnalyse = keysToAnalyse.filter((value) => value !== '_id');
  }

  keysToAnalyse.forEach((key) => {
    const analysis = getMongooseSchema(embeddedObject[key]);

    if (analysis) {
      schema[key] = analysis;
    }
  });

  if (Object.keys(schema).length === 0) {
    return null;
  }

  return schema;
}

/* istanbul ignore next */
function getMongooseArraySchema(arrayValue) {
  if (!arrayValue || arrayValue.length === 0 || !Array.isArray(arrayValue)) {
    return null;
  }

  const analyses = [];

  arrayValue.forEach((value) => {
    const analysis = getMongooseSchema(value, true);

    if (analysis) {
      analyses.push(analysis);
    }
  });

  return analyses.length ? analyses : null;
}

/* istanbul ignore next */
function getMongooseSchema(value, handleId = false) {
  if (isOfMongooseType(value)) {
    return getMongooseTypeFromValue(value);
  }

  if (Array.isArray(value)) {
    return getMongooseArraySchema(value);
  }

  if (typeof value === 'object') {
    return getMongooseEmbeddedSchema(value, handleId);
  }

  return null;
}

/* istanbul ignore next */
function hasEmbeddedTypes(analyses) {
  if (!analyses || !analyses.length) {
    return false;
  }
  return analyses.filter((analysis) => analysis.type === 'embedded').length > 0;
}

function haveSameEmbeddedType(type1, type2) {
  return typeof type1 === typeof type2
    && Array.isArray(type1) === Array.isArray(type2);
}

function areSchemaTypesMixed(type1, type2) {
  if (type1 === 'Object' || type2 === 'Object') {
    return true;
  }

  if (type1 == null || type2 == null) {
    return false;
  }

  if (typeof type1 === 'object' || typeof type2 === 'object') {
    return !haveSameEmbeddedType(type1, type2);
  }

  return type1 !== type2;
}

function areAnalysesSameEmbeddedType(arrayOfAnalysis) {
  if (!Array.isArray(arrayOfAnalysis) || !arrayOfAnalysis.length) {
    return false;
  }

  const firstAnalysis = arrayOfAnalysis[0];

  for (var i = 1; i < arrayOfAnalysis.length; i += 1) {
    if (!haveSameEmbeddedType(arrayOfAnalysis[i], firstAnalysis)) {
      return false;
    }
  }

  return true;
}

function addMongooseType(type, schema, currentKey) {
  if (!schema[currentKey]) {
    schema[currentKey] = type;
  } else if (areSchemaTypesMixed(type, schema[currentKey])) {
    schema[currentKey] = 'Object';
  }
}

function detectSubDocumentsIdUsage(schema1, schema2) {
  if (schema1._id === 'ambiguous' || schema2._id === 'ambiguous') {
    return 'ambiguous';
  }

  if (schema1._id && schema2._id) {
    return true;
  }

  if (!schema1._id && !schema2._id) {
    return false;
  }

  return 'ambiguous';
}

function iterateOnTypeKeysToAddNestedSchemas(type, schema, isArray) {
  Object.keys(type).forEach((key) => {
    addNestedSchemaToParentSchema(type[key], schema, isArray ? 0 : key);
  });
}

function setIdToSchema(type, schema) {
  const idUsage = detectSubDocumentsIdUsage(schema, type);

  if (['ambiguous', false].includes(idUsage)) {
    schema._id = idUsage;
    delete type._id;
  }
}

function addObjectSchema(type, parentSchema, currentKey) {
  const isTypeAnArray = Array.isArray(type);

  if (parentSchema[currentKey] !== undefined) {
    if (areSchemaTypesMixed(parentSchema[currentKey], type)) {
      parentSchema[currentKey] = 'Object';
    } else {
      // NOTICE: Checking subDocuments id usage for array of subDocuments.
      if (Array.isArray(parentSchema)) {
        setIdToSchema(type, parentSchema[currentKey]);
      }

      iterateOnTypeKeysToAddNestedSchemas(type, parentSchema[currentKey], isTypeAnArray);
    }
  } else {
    parentSchema[currentKey] = isTypeAnArray ? [] : {};

    // NOTICE: Init id usage for the first subDocument.
    if (!isTypeAnArray && Array.isArray(parentSchema)) {
      type._id = type._id || false;
    }

    iterateOnTypeKeysToAddNestedSchemas(type, parentSchema[currentKey], isTypeAnArray);
  }
}

function addNestedSchemaToParentSchema(type, schema, currentKey) {
  if (typeof type === 'object') {
    addObjectSchema(type, schema, currentKey);
  } else {
    addMongooseType(type, schema, currentKey);
  }
}

function mergeAnalyzedSchemas(keyAnalyses) {
  if (!areAnalysesSameEmbeddedType(keyAnalyses)) {
    return 'Object';
  }

  const firstAnalysis = keyAnalyses[0];
  var schema;
  var isNestedArray;

  if (Array.isArray(firstAnalysis)) {
    schema = [];
    isNestedArray = true;
  } else {
    schema = {};
    isNestedArray = false;
  }

  keyAnalyses.forEach((keyAnalysis) => {
    iterateOnTypeKeysToAddNestedSchemas(keyAnalysis, schema, isNestedArray);
  });

  return schema;
}

module.exports = {
  addMongooseType,
  addNestedSchemaToParentSchema,
  addObjectSchema,
  areAnalysesSameEmbeddedType,
  areSchemaTypesMixed,
  detectSubDocumentsIdUsage,
  getMongooseArraySchema,
  getMongooseEmbeddedSchema,
  getMongooseSchema,
  haveSameEmbeddedType,
  hasEmbeddedTypes,
  mergeAnalyzedSchemas,
};

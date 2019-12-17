const {
  getPrimitiveType,
  isTypePrimitive,
} = require('../utils/mongo-primitive-type');

function analyseEmbedded(embeddedObject) {
  if (!embeddedObject) {
    return null;
  }

  const schema = {};

  Object.keys(embeddedObject).forEach((key) => {
    // eslint-disable-next-line no-use-before-define
    const analysis = analyse(embeddedObject[key]);

    if (analysis) {
      schema[key] = analysis;
    }
  });

  if (Object.keys(schema).length === 0) {
    return null;
  }

  return schema;
}

function analyseArray(arrayValue) {
  if (!arrayValue || arrayValue.length === 0 || !Array.isArray(arrayValue)) {
    return null;
  }

  const analyses = [];

  arrayValue.forEach((value) => {
    // eslint-disable-next-line no-use-before-define
    const analysis = analyse(value);

    if (analysis) {
      analyses.push(analysis);
    }
  });

  return analyses.length ? analyses : null;
}

function analysePrimitive(value) {
  return getPrimitiveType(value);
}

function analyse(value) {
  if (isTypePrimitive(value)) {
    return analysePrimitive(value);
  }

  if (Array.isArray(value)) {
    return analyseArray(value);
  }

  if (typeof value === 'object') {
    return analyseEmbedded(value);
  }

  return null;
}

function hasEmbeddedTypes(analyses) {
  if (!analyses || !analyses.length) {
    return false;
  }
  return analyses.filter((analysis) => analysis.type === 'embedded').length > 0;
}

function applyType(type, structure, currentKey) {
  if (isTypePrimitive(type)) {
    if (!structure[currentKey]) {
      // eslint-disable-next-line no-param-reassign
      structure[currentKey] = type;
    } else if (structure[currentKey] !== type) {
      // eslint-disable-next-line no-param-reassign
      structure[currentKey] = 'mongoose.Mixed';
    }
  } else if (Array.isArray(type)) {
    if (structure[currentKey] === 'mongoose.Mixed') {
      // Notice: Conflicted type
      // eslint-disable-next-line no-param-reassign
      structure[currentKey] = 'mongoose.Mixed';
    } else if (Array.isArray(structure[currentKey]) === Array.isArray(type)) {
      const nestedStructure = structure[currentKey];
      type.forEach((valueAnalysed) => {
        applyType(valueAnalysed, nestedStructure, 0);
      });
    } else if (structure[currentKey]
      && Array.isArray(structure[currentKey]) !== Array.isArray(type)) {
      // eslint-disable-next-line no-param-reassign
      structure[currentKey] = 'mongoose.Mixed';
    } else {
      const nestedStructure = [];
      // eslint-disable-next-line no-param-reassign
      structure[currentKey] = nestedStructure;
      type.forEach((valueAnalysed) => {
        applyType(valueAnalysed, nestedStructure, 0);
      });
    }
  } else if (typeof type === 'object') {
    if (structure[currentKey] !== undefined) {
      if (structure[currentKey] === 'mongoose.Mixed' || typeof structure[currentKey] !== 'object') {
        // Notice: Conflicted type
        // eslint-disable-next-line no-param-reassign
        structure[currentKey] = 'mongoose.Mixed';
      } else if (typeof structure[currentKey] === 'object') {
        const nestedStructure = structure[currentKey];
        Object.keys(type).forEach((key) => {
          applyType(type[key], nestedStructure, key);
        });
      } else {
        const nestedStructure = {};
        // eslint-disable-next-line no-param-reassign
        structure[currentKey] = nestedStructure;
        Object.keys(type).forEach((key) => {
          applyType(type[key], nestedStructure, key);
        });
      }
    } else {
      const nestedStructure = {};
      // eslint-disable-next-line no-param-reassign
      structure[currentKey] = nestedStructure;
      Object.keys(type).forEach((key) => {
        applyType(type[key], nestedStructure, key);
      });
    }
  }
}

function haveSameEmbeddedType(type1, type2) {
  return typeof type1 === typeof type2
    && Array.isArray(type1) === Array.isArray(type2);
}

function areAnalysesSameEmbeddedType(arrayOfAnalysis) {
  if (!arrayOfAnalysis && arrayOfAnalysis.length < 2) {
    return true;
  }

  for (let i = 0, j = 1; j < arrayOfAnalysis.length; i += 1, j += 1) {
    if (!haveSameEmbeddedType(arrayOfAnalysis[i], arrayOfAnalysis[j])) {
      return false;
    }
  }

  return true;
}

function serializeAnalysis(fieldAnalysis) {
  if (!fieldAnalysis) {
    return null;
  }

  const analysis = { type: 'embedded' };
  analysis.schema = JSON.stringify(fieldAnalysis);

  return analysis;
}

function deserializeAnalysis(analysis) {
  if (!analysis) {
    return null;
  }

  return JSON.parse(analysis.schema);
}

function deserializeAnalyses(fieldAnalyses) {
  if (!fieldAnalyses || fieldAnalyses.length === 0) {
    return null;
  }

  const parsedFieldAnalyses = [...fieldAnalyses];

  parsedFieldAnalyses.forEach((analysis, index) => {
    if (analysis.type === 'embedded') {
      parsedFieldAnalyses[index] = deserializeAnalysis(analysis);
    }
  });

  return parsedFieldAnalyses;
}

function mergeEmbeddedDetections(keyAnalyses) {
  if (!areAnalysesSameEmbeddedType(keyAnalyses)) {
    return 'Object';
  }
  const firstAnalysis = keyAnalyses[0];
  let structure;

  if (Array.isArray(firstAnalysis)) {
    structure = [];
    keyAnalyses.forEach((keyAnalysis) => {
      keyAnalysis.forEach((valueAnalysed) => {
        applyType(valueAnalysed, structure, 0);
      });
    });
  } else if (typeof firstAnalysis === 'object') {
    structure = {};
    keyAnalyses.forEach((keyAnalysis) => {
      Object.keys(keyAnalysis).forEach((key) => {
        applyType(keyAnalysis[key], structure, key);
      });
    });
  }

  return structure;
}

module.exports = {
  analyseEmbedded,
  analyseArray,
  analysePrimitive,
  analyse,
  hasEmbeddedTypes,
  mergeEmbeddedDetections,
  areAnalysesSameEmbeddedType,
  haveSameEmbeddedType,
  deserializeAnalyses,
  applyType,
  serializeAnalysis,
  deserializeAnalysis,
};

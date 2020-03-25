const _ = require('lodash');

const reservedWords = [
  'abstract', 'await', 'boolean', 'break',
  'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'double',
  'else', 'enum', 'export', 'extends',
  'false', 'final', 'finally', 'float',
  'for', 'function', 'goto', 'if',
  'implements', 'import', 'in', 'instanceof',
  'int', 'interface', 'let', 'long',
  'module', 'native', 'new', 'null',
  'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'super',
  'switch', 'synchronized', 'this', 'throw',
  'throws', 'transient', 'true', 'try',
  'typeof', 'undefined', 'var', 'void',
  'volatile', 'while', 'with', 'yield',
];

module.exports = {
  pascalCase(input) {
    return _.chain(input).camelCase().upperFirst().value();
  },

  camelCase(input) {
    return _.camelCase(input);
  },

  isReservedWord(input) {
    return reservedWords.includes(_.toLower(input));
  },

  transformToSafeString(input) {
    if (/^[\d]/g.exec(input)) {
      return `model${input}`;
    }
    // Notice: add dash to get proper snake/pascal case
    if (this.isReservedWord(input)) {
      return `model${_.upperFirst(input)}`;
    }
    return input;
  },
};

const Sequelize = require('sequelize');

/**
 * Convert SQL expression to Javascript value when possible.
 * Otherwise, default to using Sequelize.literal(...) which will always work.
 */
class DefaultValueExpression {
  constructor(dialect, type, expression) {
    this.dialect = dialect;
    this.type = type;
    this.expression = expression;
  }

  parse() {
    if (this.expression === null || this.expression === undefined) {
      return null;
    }

    try {
      let result;
      if (this.dialect === 'postgres') {
        result = this.parsePostgres();
      } else if (this.dialect === 'mysql') {
        result = this.parseMysql();
      } else if (this.dialect === 'mssql') {
        result = this.parseMsSql();
      }

      if (result === undefined) {
        result = this.parseGeneric();
      }

      return result !== undefined ? result : Sequelize.literal(this.expression);
    } catch (e) {
      return Sequelize.literal(this.expression);
    }
  }

  parseGeneric() {
    const nulls = ['NULL'];
    const falses = ['false', 'FALSE', 'b\'0\'', '((0))'];
    const trues = ['true', 'TRUE', 'b\'1\'', '((1))'];
    const isDate = ['TIMESTAMP', 'DATETIME', 'DATE', 'TIME'];

    let result;
    if (nulls.includes(this.expression) || this.expression.startsWith('NULL::')) {
      result = null;
    } else if (falses.includes(this.expression)) {
      result = false;
    } else if (trues.includes(this.expression)) {
      result = true;
    } else if (/^-?\d+(\.\d+)?$/.test(this.expression)) {
      result = Number.parseFloat(this.expression);
      if (result.toString() !== this.expression) {
        result = Sequelize.literal(this.expression);
      }
    } else if (/^'.*'$/.test(this.expression)) {
      result = this.expression.substr(1, this.expression.length - 2).replace(/''/g, "'");
    } else if (isDate) {
      result = this.literalUnlessMatch(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})|(\d{4}-\d{2}-\d{2})|(\d{2}:\d{2}:\d{2})$/);
    }

    return result;
  }

  parseMysql() {
    // We have no way of differenciating expressions from constants
    // => Just make some guesses and default to Sequelize.literal to pass the tests.
    const isString = this.type.startsWith('VARCHAR') || this.type === 'TEXT' || this.type === 'CHAR';

    let result;
    if (this.type.startsWith('ENUM')) {
      result = this.expression;
    } else if (isString) {
      result = this.literalUnlessMatch(/^[^()]+$/);
    } else if (this.type === 'JSON') {
      const match = this.expression.match(/^[_a-z0-9]+\\'(.+)\\'$/);
      if (match) {
        result = JSON.parse(match[1]);
      }
    }

    return result;
  }

  parsePostgres() {
    let result;

    if (/^'.*'::jsonb?$/i.test(this.expression)) {
      // Special case for json/jsonb
      const [, content] = this.expression.match(/^'(.*)'::jsonb?$/i);
      result = JSON.parse(content.replace(/''/g, "'"));
    } else if (/^'.*'::[a-z_ ]+$/i.test(this.expression)) {
      // Catches types containing only alpha and spaces (int, varchar, timestamp with timezone, ...)
      // This excludes arrays or other compound types (int[], ...).
      const [, content] = this.expression.match(/^'(.*)'::[a-z_ ]+$/i);
      result = content.replace(/''/g, "'");
    }

    return result;
  }

  parseMsSql() {
    // Remove wrapping parentheses
    while (/^\(.*\)$/.test(this.expression)) {
      this.expression = this.expression.substr(1, this.expression.length - 2);
    }

    if (this.type === 'BIT') {
      if (this.expression === '1') return true;
      if (this.expression === '0') return false;
    }

    return undefined;
  }

  literalUnlessMatch(regexp) {
    return regexp.test(this.expression) ? this.expression : Sequelize.literal(this.expression);
  }
}

module.exports = DefaultValueExpression;

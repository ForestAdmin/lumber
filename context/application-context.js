/**
 * @template TContext
 */
class ApplicationContext {
  /** @private @type {TContext} */
  // @ts-ignore
  context = {}

  /**
   * @static @private
   * @param {*} Class
   * @returns {string}
   */
  static _getInstanceName(Class) {
    const className = Class.name;
    return className.charAt(0).toLowerCase() + className.slice(1);
  }

  /**
   * @param {(ApplicationContext) => void} servicesBuilder
   */
  init(servicesBuilder) {
    if (!servicesBuilder) throw new Error('missing services builder');

    servicesBuilder(this);
  }

  /**
   * @returns {TContext}
   */
  inject() {
    return this.context;
  }

  /**
   * @param {*} Class
   * @param {boolean} [overrides]
   * @returns {this}
   */
  addClass(Class, overrides) {
    if (overrides) throw new Error('overrides are forbidden in application-context. Use test-application-context.js');

    const instanceName = ApplicationContext._getInstanceName(Class);
    if (this.context[instanceName]) throw new Error(`existing class instance ${instanceName} in context`);
    this.context[instanceName] = new Class(this.context);

    return this;
  }

  /**
   * @param {string} name
   * @param {*} instance
   * @returns {this}
   */
  addInstance(name, instance) {
    if (this.context[name]) throw new Error(`existing instance { key: '${name}'} in context`);
    this.context[name] = instance;
    return this;
  }

  /**
   * @param {string} name
   * @param {(param: any) => void} work
   * @returns {this}
   */
  with(name, work) {
    work(this.context[name]);
    return this;
  }

  /**
   * No differences with addInstance for the moment, but we want to distinguish calls for clarity.
   * @param {string} name
   * @param {*} value
   * @returns {this}
   */
  addValue(name, value) {
    return this.addInstance(name, value);
  }

  /**
   * No differences with addInstance for the moment, but we want to distinguish calls for clarity.
   * @param {string} name
   * @param {Function} value
   * @returns {this}
   */
  addFunction(name, value) {
    return this.addInstance(name, value);
  }
}

module.exports = ApplicationContext;

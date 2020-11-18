// eslint-disable-next-line max-classes-per-file
const ApplicationContext = require('../../src/context/application-context');

describe('context > ApplicationContext', () => {
  it('should call the init function with itself', async () => {
    expect.assertions(1);
    const context = new ApplicationContext();

    context.init((givenContext) => {
      expect(givenContext).toBe(context);
    });
  });

  it('should add a instance to the context', () => {
    expect.assertions(1);
    const propertyValue = Symbol('instance.value');
    const context = new ApplicationContext();

    context.init((givenContext) => givenContext.addInstance('instanceServiceName', {
      propertyName: propertyValue,
    }));

    const { instanceServiceName } = context.inject();

    expect(instanceServiceName.propertyName).toStrictEqual(propertyValue);
  });

  it('should add a class instance to the context', () => {
    expect.assertions(2);

    const clazz = class TestedClass {
      static staticMethod() {
        return 'staticMethod';
      }

      instanceMethod() {
        return `instanceMethod ${this}`;
      }
    };

    const context = new ApplicationContext();

    context.init((givenContext) => givenContext.addClass(clazz));

    const { testedClass } = context.inject();

    expect(testedClass.instanceMethod()).toStrictEqual('instanceMethod [object Object]');
    expect(clazz.staticMethod()).toStrictEqual('staticMethod');
  });

  it('should throw an error because overrides not forbidden', () => {
    expect.assertions(1);
    const staticMethodStubResult = Symbol('staticMethodStubResult');
    const instanceMethodStubResult = Symbol('instanceMethodStubResult');
    const clazz = class TestedClass {
      static staticMethod() {
        return 'staticMethod';
      }

      instanceMethod() {
        return `instanceMethod ${this}`;
      }
    };

    const context = new ApplicationContext();
    expect(() => context.init((givenContext) => givenContext.addClass(clazz, {
      staticMethod: () => staticMethodStubResult,
      instanceMethod: () => instanceMethodStubResult,
    }))).toThrow('overrides are forbidden in application-context. Use test-application-context.js');
  });

  it('should apply code via `with` method', () => {
    expect.assertions(1);
    const TestClass = class {
      calledMethod = jest.fn();

      testMethod() {
        this.calledMethod();
      }
    };

    const context = new ApplicationContext();
    context.init((givenContext) => givenContext
      .addClass(TestClass)
      .with('testClass', (testClass) => testClass.testMethod()));

    const { testClass } = context.inject();

    expect(testClass.calledMethod).toHaveBeenCalledWith();
  });
});

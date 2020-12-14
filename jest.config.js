module.exports = {
  collectCoverageFrom: [
    '**/*.{js,ts,tsx}',
  ],

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/coverage',
    '/.eslint-bin/',
    '/node_modules/',
    '/test/',
    '/test-*',
    '/*.config.js',
  ],

  // The test environment that will be used for testing
  testEnvironment: 'node',
};

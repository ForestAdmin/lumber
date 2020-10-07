module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:jest/all',
    "plugin:sonarjs/recommended"
  ],
  plugins: [
    'sonarjs',
  ],
  env: {
    mocha: true,
  },
  ignorePatterns: ["test-expected"],
  rules: {
    'implicit-arrow-linebreak': 0,
    'no-underscore-dangle': [
      'error',
      {'allow': ["_id"]},
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '.eslint-bin/*.js',
          'test/**/*.js'
        ]
      }
    ],
    'no-multiple-empty-lines': [
      'error',
      {
        max: 1,
        maxBOF: 0,
        maxEOF: 0
      }
    ],
  }
};

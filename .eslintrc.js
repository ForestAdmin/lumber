module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:jest/all',
    "plugin:sonarjs/recommended"
  ],
  plugins: [
    "sonarjs"
  ],
  env: {
    mocha: true,
  },
  rules: {
    'sonarjs/no-identical-functions': 0,
    'sonarjs/no-duplicate-string': 0,
    'sonarjs/no-same-line-conditional': 0,
    'implicit-arrow-linebreak': 0,
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '.eslint-bin/*.js',
          'scripts/*.js',
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
    ]
  }
};

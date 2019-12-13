module.exports = {
  root: true,
  extends: [
    'airbnb-base'
  ],
  plugins: [],
  env: {
    mocha: true,
  },
  rules: {
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

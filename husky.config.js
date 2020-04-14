module.exports = {
  hooks: {
    'pre-commit': 'node ./.eslint-bin/pre-commit-hook.js',
    'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS',
  },
};

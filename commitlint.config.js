// NOTICE: When a github "squash and merge" is performed, github add the PR link in the commit
//         message using the format ` (#<PR_ID>)`. Github provide the target branch of the build,
//         so authorizing 4+5 = 9 characters more on master for the max header length should work
//         until we reach PR #99999.

let maxLineLength = 100;

const prExtrasChars = 9;

const isPushEvent = process.env.GITHUB_EVENT_NAME === 'push';

if (isPushEvent) {
  maxLineLength += prExtrasChars;
}

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [1, 'always', maxLineLength],
    'body-max-line-length': [1, 'always', maxLineLength],
    'footer-max-line-length': [1, 'always', maxLineLength],
  },
};

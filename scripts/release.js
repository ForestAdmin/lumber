require('dotenv').config(); // eslint-disable-line
const { ReleaseManager, ReleaseNoteManager } = require('@forestadmin/devops'); // eslint-disable-line

const { DEVOPS_SLACK_TOKEN, DEVOPS_SLACK_CHANNEL } = process.env;
const OPTIONS = { releaseIcon: '👾', withVersion: true };

new ReleaseManager(OPTIONS).create()
  .then(() => new ReleaseNoteManager(DEVOPS_SLACK_TOKEN, DEVOPS_SLACK_CHANNEL, OPTIONS).create());

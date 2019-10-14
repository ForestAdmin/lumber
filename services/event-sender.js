const superagent = require('superagent');

const FOREST_URL = process.env.FOREST_URL || 'https://forestadmin-server.herokuapp.com';

class EventSender {
  constructor() {
    this.appName = null;
    this.command = null;
  }

  async notifyError(code = 'unknown_error', message = null, context = undefined) {
    if (!this.appName || !this.command) { return; }

    try {
      await superagent.post(`${FOREST_URL}/api/lumber/error`, {
        data: {
          type: 'events',
          attributes: {
            code,
            message,
            project_name: this.appName,
            command: this.command,
            context,
          },
        },
      });
    } catch (e) {
      // NOTICE: We want silent error because this is just for reporting error
      //         and not not blocking if that does not work.
    }
  }

  async notifySuccess() {
    if (!this.appName || !this.command) { return; }

    try {
      await superagent.post(`${FOREST_URL}/api/lumber/success`, {
        data: {
          type: 'events',
          attributes: {
            command: this.command,
            project_name: this.appName,
          },
        },
      });
    } catch (e) {
      // NOTICE: We want silent error because this is just for reporting error
      //         and not not blocking if that does not work.
    }
  }
}

module.exports = new EventSender();

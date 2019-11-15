class AbstractPrompter {
  constructor(requests) {
    this.requests = requests;
  }

  isOptionRequested(option) {
    if (!option) { return false; }

    return this.requests.includes(option);
  }
}

module.exports = AbstractPrompter;

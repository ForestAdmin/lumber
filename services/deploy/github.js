'use strict';
let P = require('bluebird');
let GithubAPI = require('github');

function Github(config) {
  let github = new GithubAPI({
    protocol: 'https',
    host: 'api.github.com',
    Promise: P,
    followRedirects: false,
    timeout: 5000
  });

  this.login = () => {
    return new P((resolve) => {
      github.authenticate({
        type: 'basic',
        username: config.githubUsername,
        password: config.githubPassword
      });

      resolve();
    });
  };

  this.getRepoArchiveLink = () => {
    let githubRepo = config.githubRepo.split('/');

    return github.repos
      .getArchiveLink({
        owner: githubRepo[0],
        repo: githubRepo[1],
        'archive_format': 'tarball',
        ref: 'master'
      })
      .then((response) => response.meta.location);
  };
}

module.exports = Github;



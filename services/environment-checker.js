function EnvironmentChecker(env, logger, deprecated) {
  this.deprecated = deprecated;

  this.getActiveEnvironmentVariables = () => {
    return this.deprecated.filter(variable => env[variable] !== undefined);
  };

  this.logWarnings = () => {
    const activeEnvironmentVariables = this.getActiveEnvironmentVariables();
    if (activeEnvironmentVariables.length) {
      logger.warn(
        'Environment variables usage detected:',
        activeEnvironmentVariables.map(variable => ` - ${variable}`),
        'Environment variables will be removed in the future major Lumber version. Please use command parameters instead.',
        'Type `lumber help` for more information.',
      );
    }
  };
}

module.exports = EnvironmentChecker;

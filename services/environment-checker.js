function EnvironmentChecker(env, logger, deprecated) {
  this.deprecated = deprecated;

  this.getActives = () => this.deprecated.filter(variable => env[variable] !== undefined);

  this.logWarnings = () => {
    const activeEnvironmentVariables = this.getActives();
    if (activeEnvironmentVariables.length) {
      logger.warn(
        'Environment variable usage detected:',
        ...activeEnvironmentVariables.map(variable => ` - ${variable}`),
        'Environment variables are DEPRECATED and will be removed in the future major Lumber version. Please use command parameters instead.',
        'Type `lumber help` for more information.',
      );
    }
  };
}

module.exports = EnvironmentChecker;

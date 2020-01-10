const validate = require('validate-npm-package-name');

module.exports = function toValidPackageName(packageName) {
  function isValid(name) {
    const { validForNewPackages } = validate(name);
    return validForNewPackages;
  }

  if (!isValid(packageName)) {
    // NOTICE: Create an always valid package name (disallow almost everything)
    const validPackageName = packageName.toLowerCase()
      // Remove all non "a-z", "0-9", "-" characters with hyphen.
      .replace(/[^a-z0-9\\-]/g, '-')
      // Remove hyphen sequence (> 1).
      .replace(/-{2,}/g, '-')
      // Remove leading and trailing hyphen.
      .replace(/^-|-$/g, '');

    // NOTICE: Return 'lumber-project' if sanitized package name is still not valid.
    return isValid(validPackageName) ? validPackageName : 'lumber-project';
  }

  return packageName;
};

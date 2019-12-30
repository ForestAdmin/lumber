const validate = require('validate-npm-package-name');

module.exports = function toValidPackageName(packageName) {
  const { validForNewPackages, validForOldPackages } = validate(packageName);
  const isValid = validForNewPackages && validForOldPackages;

  if (!isValid) {
    // NOTICE: hard slugify mode (disallow almost everything)
    return packageName.toLowerCase()
      // Remove all non "a-z", "0-9", "-" characters with hyphen.
      .replace(/[^a-z0-9\\-]/g, '-')
      // Remove hyphen sequence (> 1).
      .replace(/-{2,}/g, '-')
      // Remove leading and trailing hyphen.
      .replace(/^-|-$/g, '')
      // If empty, replace with my-lumber-project.
      .replace(/^-*$/g, 'my-lumber-project');
  }

  return packageName;
};

const fs = require('fs');

function DirectoryExistenceChecker(path, directory) {
  this.perform = () => {
    const directoryToCheck = `${path}/${directory}`;
    try {
      fs.accessSync(directoryToCheck, fs.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  };
}

module.exports = DirectoryExistenceChecker;

const simpleGit = require('simple-git')(`${__dirname}/..`);

const getFilesModified = () => new Promise((resolve, reject) => {
  simpleGit.status((error, status) => {
    if (error) {
      reject(error)
    }
    resolve(
      status.files
        .map(file => file.path)
        .filter(file => file.endsWith('.js')),
    )
  });
});

const runEslint = (listFilesModified) => {
  if (listFilesModified.length === 0) {
    return;
  }

  console.log(`[ESLint] Validating changed files:\n${listFilesModified.join('\n')}`);
  const eslintPath = `${__dirname}/../node_modules/.bin/eslint`;
  const spawn = require('child_process').spawn;
  const cmd = spawn(eslintPath, listFilesModified, { stdio: 'inherit', shell: true });

  return new Promise((resolve, reject) => {
    cmd.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${eslintPath} returns non-zero code ${code}`));
      }
    });
  });
};

const onError = (error) => {
  console.error(error);
  process.exit(-1);
};

getFilesModified()
  .then(runEslint)
  .catch(onError);

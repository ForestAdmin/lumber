const fs = require('fs');
const _ = require('lodash');
const requireAll = require('require-all');

module.exports = function (app) {
  app.get('/', (req, res) => {
    const middlewares = requireAll({ dirname: `${__dirname}/..` });
    const templatePath = `${__dirname}/template.txt`;
    const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    res.send(template({ middlewares: Object.keys(middlewares) }));
  });
};

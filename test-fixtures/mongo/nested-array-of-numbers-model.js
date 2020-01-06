const { ObjectID } = require('mongodb');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
    propArrayOfNumbers: [1, 2, 3],
  },
];

module.exports = { persons };

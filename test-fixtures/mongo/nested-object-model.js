const { ObjectID } = require('mongodb');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
    propGroup: {
      answer: false,
      date: new Date(),
      sentence: 'Life is beautiful',
      number: 1664,
    },
  },
];

module.exports = { persons };

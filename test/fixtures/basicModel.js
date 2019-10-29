const { ObjectID } = require('mongodb');
const _ = require('lodash');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
  },
];

const films = [
  {
    _id: ObjectID(),
    title: 'Terminator',
    author: _.find(persons, { name: 'James Cameron' })._id,
  },
];

module.exports = { films, persons };

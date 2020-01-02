const { ObjectID } = require('mongodb');
const _ = require('lodash');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
  },
  {
    _id: ObjectID(),
    name: 'Sam Worthington',
  },
  {
    _id: ObjectID(),
    name: 'Zoe Saldana',
  },
];

const films = [
  {
    _id: ObjectID(),
    title: 'Terminator',
    author: _.find(persons, { name: 'James Cameron' })._id,
    actors: [
      _.find(persons, { name: 'Sam Worthington' })._id,
      _.find(persons, { name: 'Zoe Saldana' })._id,
    ],
  },
];

module.exports = { films, persons };

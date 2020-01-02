const { ObjectID } = require('mongodb');
const _ = require('lodash');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
  },
];

const actors = [
  {
    _id: ObjectID(),
    name: 'Jim Carrey',
  },
];

const films = [
  {
    _id: ObjectID(),
    title: 'Terminator',
    author: _.find(persons, { name: 'James Cameron' })._id,
    refersTo: 'persons',
  },
  {
    _id: ObjectID(),
    title: 'The mask',
    author: _.find(actors, { name: 'Jim Carrey' })._id,
    refersTo: 'actors',
  },
];

module.exports = { films, persons, actors };

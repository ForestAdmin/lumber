/* eslint no-underscore-dangle: off */
const { ObjectID } = require('mongodb');
const _ = require('lodash');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
  },
];

const films = [];

// eslint-disable-next-line no-plusplus
for (let i = 0; i < 50; i++) {
  films.push({
    _id: ObjectID(),
    title: `Terminator #${i}`,
    author: null,
  });
}

films.push({
  _id: ObjectID(),
  title: 'Terminator',
  author: _.find(persons, { name: 'James Cameron' })._id,
});

// eslint-disable-next-line no-plusplus
for (let i = 0; i < 50; i++) {
  films.push({
    _id: ObjectID(),
    title: `Terminator 2 #${i}`,
  });
}

module.exports = { films, persons };

const { ObjectID } = require('mongodb');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
    propArrayOfObjects: [
      {
        _id: ObjectID(),
        one: 'one',
        two: 'two',
      },
      {
        _id: ObjectID(),
        one: '1',
        two: '2',
      },
    ],
  },
  {
    _id: ObjectID(),
    name: 'James Cameron',
    propArrayOfObjects: [
      {
        _id: ObjectID(),
        one: 1,
        two: 'two',
      },
      {
        _id: ObjectID(),
        one: '1',
        two: '2',
      },
    ],
  },
];

module.exports = { persons };

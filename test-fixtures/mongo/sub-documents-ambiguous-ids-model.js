const { ObjectID } = require('mongodb');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
    propArrayOfObjects: [
      {
        sampleValue: 'sample',
      },
      {
        _id: ObjectID(),
        sampleValue: 'sample value',
      },
    ],
  },
];

module.exports = { persons };

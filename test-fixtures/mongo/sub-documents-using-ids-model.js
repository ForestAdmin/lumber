const { ObjectID } = require('mongodb');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
    propArrayOfObjects: [
      {
        _id: ObjectID(),
        'complex name': 'sample',
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

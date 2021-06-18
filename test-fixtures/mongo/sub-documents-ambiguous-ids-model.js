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
        'complex name': 'sample',
      },
    ],
  },
];

module.exports = { persons };

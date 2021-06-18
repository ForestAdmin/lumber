const { ObjectID } = require('mongodb');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
    propArrayOfObjects: [
      {
        sampleValue: 'sample',
        'complex name': 'sample',
      },
    ],
  },
];

module.exports = { persons };

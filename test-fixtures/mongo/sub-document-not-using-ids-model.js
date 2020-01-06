const { ObjectID } = require('mongodb');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
    propArrayOfObjects: [
      {
        sampleValue: 'sample',
      },
    ],
  },
];

module.exports = { persons };

/* eslint no-underscore-dangle: off */
const { ObjectID } = require('mongodb');

const persons = [
  {
    _id: ObjectID(),
    name: 'James Cameron',
    very: {
      deep: {
        model: {
          arrayOfNumber: [1, 2, 3],
          arrayMixed: [1, 'two', true, new Date()],
          arrayOfObjectIds: [
            ObjectID(),
            ObjectID(),
            ObjectID(),
          ],
          arrayWithComplexObject: [
            {
              name: 'Françis',
              propGroup: {
                answer: false,
                date: new Date(),
                sentence: 'Life is beautiful',
                number: 1664,
              },
            },
          ],
          arrayOfComplexObjects: [
            {
              propGroup: {
                answer: false,
                date: new Date(),
              },
              so: {
                nested: {
                  arrayOfNumber: [1, 2, 3],
                  arrayMixed: [1, 'two', true, new Date()],
                },
              },
            },
            {
              propGroup: {
                sentence: 'Life is beautiful',
                number: 1664,
              },
              so: {
                nested: {
                  arrayOfNumber: [1, 2, 3],
                  arrayMixed: [1, 'two', true, new Date()],
                },
              },
            },
          ],
        },
      },
    },
  },
];

module.exports = { persons };

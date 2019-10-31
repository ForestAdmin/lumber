module.exports = () => ({
  books: {
    fields: [
      {
        defaultValue: null,
        name: 'title',
        nameColumn: 'title',
        primaryKey: false,
        type: 'STRING',
      },
      {
        defaultValue: null,
        name: 'createdAt',
        nameColumn: 'createdAt',
        primaryKey: false,
        type: 'DATE',
      },
      {
        defaultValue: null,
        name: 'updatedAt',
        nameColumn: 'updatedAt',
        primaryKey: false,
        type: 'DATE',
      },
    ],
    options: {
      hasIdColumn: true,
      hasPrimaryKeys: true,
      timestamps: true,
      underscored: false,
    },
    primaryKeys: [
      'id',
    ],
    references: [
      {
        as: 'author',
        foreignKey: 'authorId',
        foreignKeyName: 'authorId',
        ref: 'authors',
      },
    ],
  },
  authors: {
    fields: [
      {
        name: 'name',
        nameColumn: 'name',
        type: 'STRING',
        primaryKey: false,
        defaultValue: null,
      },
      {
        defaultValue: null,
        name: 'createdAt',
        nameColumn: 'createdAt',
        primaryKey: false,
        type: 'DATE',
      },
      {
        defaultValue: null,
        name: 'updatedAt',
        nameColumn: 'updatedAt',
        primaryKey: false,
        type: 'DATE',
      },
    ],
    references: [],
    primaryKeys: [
      'id',
    ],
    options: {
      underscored: false,
      timestamps: true,
      hasIdColumn: true,
      hasPrimaryKeys: true,
    },
  },
});

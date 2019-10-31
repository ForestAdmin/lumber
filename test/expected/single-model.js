module.exports = dialect => ({
  users: {
    fields: [
      {
        name: 'email',
        nameColumn: 'email',
        type: 'STRING',
        primaryKey: false,
        defaultValue: null,
      },
      {
        name: 'emailValid',
        nameColumn: 'emailValid',
        type: dialect === 'mysql' ? 'INTEGER' : 'BOOLEAN',
        primaryKey: false,
        defaultValue: null,
      },
      {
        name: 'firstName',
        nameColumn: 'firstName',
        type: 'STRING',
        primaryKey: false,
        defaultValue: null,
      },
      {
        name: 'lastName',
        nameColumn: 'lastName',
        type: 'STRING',
        primaryKey: false,
        defaultValue: null,
      },
      {
        name: 'username',
        nameColumn: 'username',
        type: 'STRING',
        primaryKey: false,
        defaultValue: null,
      },
      {
        name: 'password',
        nameColumn: 'password',
        type: 'STRING',
        primaryKey: false,
        defaultValue: null,
      },
      {
        name: 'createdAt',
        nameColumn: 'createdAt',
        type: 'DATE',
        primaryKey: false,
        defaultValue: null,
      },
      {
        name: 'updatedAt',
        nameColumn: 'updatedAt',
        type: 'DATE',
        primaryKey: false,
        defaultValue: null,
      },
      {
        name: 'resetPasswordToken',
        nameColumn: 'resetPasswordToken',
        type: 'STRING',
        primaryKey: false,
        defaultValue: null,
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

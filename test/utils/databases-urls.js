const databases = [
  {
    dialect: 'mysql',
    connectionUrl: 'mysql://forest:secret@localhost:8999/lumber-sequelize-test',
  },
  {
    dialect: 'postgres',
    connectionUrl: 'postgres://forest:secret@localhost:54369/lumber-sequelize-test',
  },
];

module.exports = { databases };

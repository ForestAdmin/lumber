const Sequelize = require('sequelize');

class ModelsWithRelations {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }
  async build() {
    const Book = this.sequelize.define('book', {
      title: { type: Sequelize.STRING },
      authorId: { type: Sequelize.INTEGER },
    });
    const Author = this.sequelize.define('author', {
      name: { type: Sequelize.STRING },
    });
    await this.sequelize.drop();
    await Author.sync({ force: true });
    await Book.belongsTo(Author);
    await Book.sync({ force: true });
  }
}

module.exports = ModelsWithRelations;

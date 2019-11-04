const Sequelize = require('sequelize');

class ModelsWithRelations {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }
  build() {
    const Book = this.sequelize.define('book', {
      title: { type: Sequelize.STRING },
      authorId: { type: Sequelize.INTEGER },
    });
    const Author = this.sequelize.define('author', {
      name: { type: Sequelize.STRING },
    });
    Book.belongsTo(Author);
    return [Author, Book];
  }
}

module.exports = ModelsWithRelations;

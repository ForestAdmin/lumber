const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');

class SequelizeHelper {
  connect(url) {
    this.sequelize = new Sequelize(url, {
      logging: false,
      pool: { maxConnections: 10, minConnections: 1 },
      dialectOptions: {
        multipleStatements: true,
      },
    });
    return new Promise((resolve, reject) => {
      this.sequelize.authenticate()
        .then(() => resolve(this.sequelize))
        .catch((err) => reject(err));
    });
  }

  async forceSync(table) {
    const dialect = this.sequelize.getDialect();
    const mssqlDropConstraints = `
      DECLARE @SQL varchar(4000)=''
      SELECT @SQL = 
      @SQL + 'ALTER TABLE ' + s.name+'.'+t.name + ' DROP CONSTRAINT [' + RTRIM(f.name) +'];' + CHAR(13)
      FROM sys.Tables t
      INNER JOIN sys.foreign_keys f ON f.parent_object_id = t.object_id
      INNER JOIN sys.schemas     s ON s.schema_id = f.schema_id

      EXEC (@SQL)
    `;
    if (dialect === 'mysql') {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => table.sync({ force: true }))
        .then(() => this.sequelize.query('SET FOREIGN_KEY_CHECKS = 1'));
    } else if (dialect === 'mssql') {
      await this.sequelize.query(mssqlDropConstraints)
        .then(() => table.sync({ force: true }));
    } else {
      await table.sync({ force: true });
    }
  }

  async given(tableName) {
    const dialect = this.sequelize.getDialect();
    const fixtureFilename = path.join(__dirname, `../fixtures/${dialect}/${tableName}.sql`);
    const expectedFilename = path.join(__dirname, `../expected/sql/db-analysis-output/${dialect}/${tableName}.json`);
    const fixtureFileContent = await fs.readFileSync(fixtureFilename, 'utf8');
    await this.drop(tableName, dialect);
    await this.sequelize.query(fixtureFileContent);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(expectedFilename);
  }

  async dropAndCreate(tableName) {
    const dialect = this.sequelize.getDialect();
    const fixtureFilename = path.join(__dirname, `../fixtures/${dialect}/${tableName}.sql`);
    const fixtureFileContent = await fs.readFileSync(fixtureFilename, 'utf8');
    await this.drop(tableName, dialect);
    return this.sequelize.query(fixtureFileContent);
  }

  async drop(tableName, dialect) {
    const mssqlDropConstraints = `
      DECLARE @SQL varchar(4000)=''
      SELECT @SQL = 
      @SQL + 'ALTER TABLE ' + s.name+'.'+t.name + ' DROP CONSTRAINT [' + RTRIM(f.name) +'];' + CHAR(13)
      FROM sys.Tables t
      INNER JOIN sys.foreign_keys f ON f.parent_object_id = t.object_id
      INNER JOIN sys.schemas     s ON s.schema_id = f.schema_id
      WHERE OBJECT_NAME(f.referenced_object_id) = '${tableName}'

      EXEC (@SQL)
    `;

    if (dialect === 'mysql') {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
      await this.sequelize.query(`DROP TABLE IF EXISTS ${tableName}`);
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    } else if (dialect === 'mssql') {
      await this.sequelize.query(mssqlDropConstraints);
      await this.sequelize.query(`IF OBJECT_ID('dbo.${tableName}', 'U') IS NOT NULL DROP TABLE dbo.${tableName}`);
    } else {
      await this.sequelize.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
    }
  }

  close() {
    return this.sequelize.close();
  }

  async dropAllTables() {
    await this.sequelize.drop();
  }
}

module.exports = SequelizeHelper;

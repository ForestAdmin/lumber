# Change Log

## [Unreleased]
### Changed
- Dependencies - Remove obsolete `mysql` dependency.

### Fixed
- Command Generate - Avoid foreignKey to conflict with relationship.
- Command Generate - Fix creation of project containing whitespaces.
- Records Update - Fix `TINYINT` column update when declared as a `BOOLEAN` field in the ORM model.
- Technical - Fix Github repository language.
- Generate command - Generate field with type "TIME WITHOUT TIME ZONE".
- Command Generate - Remove schema prompt with MongoDB connection URL.

## RELEASE 2.4.0 - 2019-09-20
### Changed
- Generate command - Change default application port to prevent conflicts.

## RELEASE 2.3.15 - 2019-09-20
### Added
- Technical - A Release now also automatically publish the release note to Slack.

### Changed
- Generate command - Improve logs of non automatically handled type.
- Generate command - Remove some logs to avoid confusion.
- Install command - Remove logs about type not handled to avoid confusion.

### Fixed
- Column Types - Do not detect SQL "Point" type and convert them as "INTEGER" anymore.
- Technical - Upgrade sequelize version to avoid sql injection.

## RELEASE 2.3.14 - 2019-09-12
### Fixed
- Mongodb - Lumber now supports Mongodb v4.2.0.

## RELEASE 2.3.13 - 2019-09-11
### Fixed
- Generate command - Make the command fail immediately if the project name entered corresponds to a directory present in the current directory (instead of failing after all the prompt questions...).
- Generate command - Fix MongoDB models creation.

## RELEASE 2.3.12 - 2019-09-11
### Changed
- Technical - Remove old tests dependencies.

### Fixed
- Schema Option - Ask for the database schema option if a connectionUrl option is set.
- MongodbSrv Option - Ask for the MongodbSrv option if a connectionUrl option is set with a mongodb dialect.
- Security - Upgrade `lodash` dependencies to patch vulnerabilities.

## RELEASE 2.3.11 - 2019-09-10
### Added
- Technical - Setup a minimal tests configuration.
- Technical - Setup a minimal CI configuration.
- Readme - Add a CI badge in the README.md file.

### Fixed
- Command Generate - Fix generation of project with no database.
- Deployments - Ensure that a deployment on Heroku works well. 🛡

## RELEASE 2.3.10 - 2019-09-05
### Fixed
- Command Generate - Fix generation of targetKey.

## RELEASE 2.3.9 - 2019-08-29
### Fixed
- Command Generate - Fix install of lumber-forestadmin when using mysql with no schema.

## RELEASE 2.3.8 - 2019-08-29
### Fixed
- Command Generate - Add support for `INET` and `DOUBLE` types.
- Command Generate - Add support for `TIME` type.

## RELEASE 2.3.7 - 2019-08-28
### Fixed
- Command Generate - Fix generation of field when table is underscored and field contains digits.

## RELEASE 2.3.6 - 2019-08-27
### Fixed
- Command Generate - Fix underscored true not set when it should.

## RELEASE 2.3.5 - 2019-08-26
### Fixed
- Release - Fix previous broken release.

## RELEASE 2.3.4 - 2019-08-26
### Fixed
- Command Update - Use SSL for database connections configured with SSL on `lumber update` commands.

## RELEASE 2.3.3 - 2019-08-22
### Changed
- Technical - Add `yarn.lock` to `.gitignore`

### Fixed
- Command Generate - Fix application host/port usage when using a connection url or Docker.
- Models - Prevent bad Sequelize model generation if origin table does not contain `id` column nor primary keys.

## RELEASE 2.3.2 - 2019-08-14
### Added
- Readme - Add a badge for the NPM package version.

### Changed
- Technical - Factorize duplicated code.
- Command Generate - Normalize the fields name on generate inside models.
- Command Generate - Create better naming of belongsTo relationships.
- Command Generate - Improve visibility on type ENUM with one line per value.
- Readme - Improve the community section.
- Readme - Remove the Licence section as it it not the right one and it is already accessible in the Github page header.

### Fixed
- Command Generate - Fix package name.
- Command Generate - Remove trailing spaces in `.env`.
- Technical - Apply ESLint rules to `database-analyzer`.
- Command Generate - Do not duplicate `createdAt` and `updatedAt` if not named as camelCase in database.
- Command Generate - Fix generation of field with type array.
- Command Generate - Prevent internal errors for Mongoose databases having collections without name.
- Command Generate - Fix generation of relationship if foreign key is unconventional.
- Command Generate - Declare table as underscored only if all fields respect the convention.

## RELEASE 2.3.1 - 2019-08-05
### Fixed
- Command Update - Fix update with custom database schema.
- Command Install - Fix install with custom database schema.

## RELEASE 2.3.0 - 2019-08-02
### Added
- Default Values - Define fields with their default value.
- Fields - Support Float types.

### Changed
- Technical - Rename the database analyzer service.
- Technical - Rename the database connection service.
- Technical - Split the database analyzer into several services.

### Fixed
- Models - Fix models template to prevent useless newlines.
- Models - Fix missing "id" field definitions for fields that are not both of integer type and primary.
- Models - Remove some trailing spaces in generated models.

## RELEASE 2.2.4 - 2019-07-25
### Added
- Technical - Add an issue template to have better context for submitted issues.

### Fixed
- Command Generate - Fix generate on database with a custom schema.

## RELEASE 2.2.3 - 2019-07-16
### Fixed
- Docker - Fix missing port in Docker files if generated using Docker.

## RELEASE 2.2.2 - 2019-07-15
### Changed
- Build - Reduce package size removing assets folder from it (fix previous trial).

## RELEASE 2.2.1 - 2019-07-15
### Changed
- Build - Reduce package size removing assets folder from it.

## RELEASE 2.2.0 - 2019-07-15
### Changed
- Code Style - Apply code conventions.
- Command Generate - Stop asking for a port for the generated server and use "3000" as default value.
- Environment variables - Expose all existing environment variables on server creation to educate users.
- Install - Make `npm install` command silent to prevent useless logs.
- Code Style - Rename some variables in `services/db.js`.

### Fixed
- Prompt - Display consistent spacing across questions.
- Readme - Fix the readme according to the new behaviour.
- Generate - Fix custom application host and port on ForestAdmin project generation.
- Generate - Users using the connection option can now choose a SSL database connection.
- MongoDB - Fix the generate command for MongoDB SRV database urls.

## RELEASE 2.1.4 - 2019-07-04
### Fixed
- Onboarding - Fix the `lumber generate` command (Regression introduced in v2.1.3).

## RELEASE 2.1.3 - 2019-07-03
### Fixed
- Command Generate - Fix dependencies `pg` when using `DATABASE_URL`.
- Technical - Add `FOREST_URL` for easier development.

## RELEASE 2.1.2 - 2019-07-02
### Fixed
- Command Generate - Fix package.json in app name contains whitespaces.
- Command Install - Fix `SSL_DATABASE` parsing.
- Command Install - Fix install with mongodb.

## RELEASE 2.1.1 - 2019-06-27
### Fixed
- Command Install - Add environment variable HOSTNAME.

## RELEASE 2.1.0 - 2019-06-26
### Fixed
- Command Generate - Upgrade sequelize version to avoid vulnerabilities.
- Command Install - Fix install with ssl.
- Command Generate - Use `SSL_DATABASE` instead of `DATABASE_SSL` for generating a project.

## RELEASE 2.0.9 - 2019-06-05
### Changed
- Welcome middleware - Change the design of the welcome plugin.

## RELEASE 2.0.6 - 2019-05-15
### Changed
- Docker - Install the lumber-cli NPM package in the container.

## RELEASE 2.0.5 - 2019-05-15
### Changed
- Docker - Remove the lumber-forestadmin stuff from the Dockerfile.
- Welcome middleware - Change the design of the welcome plugin.

## RELEASE 2.0.4 - 2019-05-13
### Changed
- Docker - Create an image to run the generate command + install the lumber-forestadmin plugin.

## RELEASE 2.0.3 - 2019-05-09
### Changed
- Command Generate - Rename all env vars to avoid the prompt.

## RELEASE 2.0.2 - 2019-05-07
### Fixed
- Command Generate - Ask for the database hostname when not using -c option.

## RELEASE 2.0.1 - 2019-05-06
### Changed
- Docker - Remove docker instruction for now.

## RELEASE 2.0.0 - 2019-05-02
### Changed
- Loose coupling - Use Lumber as a backend generator that leverages a set of plugins.

## RELEASE 1.14.3 - 2019-04-09
### Added
- Tools - Add a deploy script.
- Tools - Add Docker build files.
- Command Update - Add the new FOREST_DB_DIALECT environment variable to be able to configure project fastly.
- Command Generate - Ensure the user is logged in before executing the generate command.

### Changed
- Technical - Rename environment variable SERVER_HOST to FOREST_URL.
- Opn - Completely remove the opn NPM package.
- Dependencies - Fix vulnaribilities by upgrading the dependencies in the package.json.
- Command Generate - Make the projectName argument mandatory from the command line args.
- Command Login - Make the email argument mandatory from the command line args.
- Prompt - Improve the display of success/info/error command responses.
- Wording - Improve the readability of some prompt responses.
- Wording - Replace all existing mentions of "back office" by "admin panel" or "admin panel API".
- Improvement - Reduce the number of http requests to init the project.

### Fixed
- Command Update - Fix the ssl environment variable.
- Command Generate - Fix the connection url option.
- Command Generate - Fix the models/index.js file creation when using the -c option.
- Command Generate - Ensure project creation works when the project name already exists without being initialized.
- SSL options - Convert the value to lowercase to ensure the option is correctly parsed.

## Release 1.14.2
### Fixed
- Command Generate - Avoid to crash if there's a conflict on the project name.

## Release 1.14.2
### Fixed
- Command Generate - Avoid to crash if there's a conflict on the project name.

## Release 1.14.1
### Fixed
- Command Update - Add the 'ssl' prompt option.

## Release 1.14.0
### Fixed
- Inquirer - Upgrade inquirer to 6.2.0 for Win 10 support.

## Release 1.13.3
### Changed
- MongoDB - Limit the mapReduce to 100 items to prevent very long query.
- MongoDB - Force the right collection name to use in the models' definition.

## Release 1.13.2
### Added
- MongoDB - Support SRV connection string.
- MongoDB - Catch the CMD_NOT_ALLOWED: mapreduce error throw by MongoDB Atlas' free plan.

## Release 1.13.1
### Changed
- SQLite Support - Remove the SQLite support because node-sqlite3 breaks on each new Node version.

## Release 1.13.0
- Deploy - Change the documentation link.
- MongoDB Support - Support MongoDB database.

## Release 1.12.0
### Added
- SQLite Support - Re-enable the support of SQLite.

### Changed
- Error handling - Catch properly the error when DATABASE_URL does not exist.

## Release 1.11.1
### Changed
- Dependency - Upgrade dotenv.

### Fixed
- Command Update - Improve the regexp to detect model and existing fields.

## Release 1.11.0
### Changed
- On-boarding - Improve the on-boarding experience.

## Release 1.10.3
### Fixed
- Command Update - Fix `lumber update` command execution.

## Release 1.10.0
### Changed
- MySQL & PostgreSQL - Detect enum type for model generation.
- Technical - Use the "official" domain for the default server host.

## Release 1.9.0
### Changed
- Security - Set a stronger password policy.

### Fixed
- Dependency - Add the package expand-home-dir.

### Added
- SQLite Support - Support SQLite databases.
- Field Types - Support 'TIMESTAMP' column type (MySQL).
- MSSQL Support - Support Lumber generation on a MSSQL database hosted on Windows Azure.
- MSSQL Support - Support new database types (MONEY, NTEXT, NVARCHAR).
- Connection errors - Display the error stack trace to help users understand why the connection to the database failed.

### Fixed
- MSSQL Support - BIT types are now detected as Boolean instead of Number.
- Warnings - Remove a potential console deprecation warning.

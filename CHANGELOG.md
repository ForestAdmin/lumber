# Change Log

## [Unreleased]
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

# Change Log

### Changed
- Security - Set a stronger password policy.

### Fixed
- Dependency - Add the package expand-home-dir.

### Added
- SQLite Support - Support SQLite databases.
- Field Types - Support 'TIMESTAMP' column type (MySQL).
- MSSQL Support - Support Lumber generation on a MSSQL database hosted on Windows Azure.
- MSSQL Support - Support new database types (MONEY, NTEXT, NVARCHAR).
- Connection errors - Display the error stack trace to help users understand why the connection to the database failed.

### Fixed
- MSSQL Support - BIT types are now detected as Boolean instead of Number.
- Warnings - Remove a potential console deprecation warning.

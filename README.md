# Lumber

<p align="center">
  <img src="https://github.com/ForestAdmin/Lumber/blob/master/assets/lumber-logo.png?raw=true" alt="Lumber logo">
</p>

Lumber is a CLI tool that helps you create your backend application in minutes.
At its core, Lumber has been designed with a modural architecture thanks to a set of plugins.

For example, this means it takes one command to get a REST API, a GraphQL API or a fully operational Admin Panel.

## Install

```sh
npm install -g lumber-cli
```

## Plugins

|Plugin                                                                  | Description                                                                                |
|------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
|[lumber-forestadmin](https://github.com/ForestAdmin/lumber-forestadmin) | Install Forest Admin to get an off-the-shelf admin panel based on a highly-extensible API. |
|[lumber-graphql](https://github.com/ForestAdmin/lumber-graphql)         | Generate a GraphQL API.                                                                    |

## Commands

`$ lumber [command]`

- `generate`      generate a backend application with an ORM/ODM configured.
- `update`        update your models's definition according to your database schema
- `install`       install a Lumber plugin.
- `help [cmd]`    display help for [cmd]

## License
[GPL](https://github.com/ForestAdmin/Lumber/blob/master/LICENSE)

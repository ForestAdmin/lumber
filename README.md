# Lumber

<p align="center">
  <img src="https://github.com/ForestAdmin/Lumber/blob/master/assets/lumber-logo.png?raw=true" alt="Lumber logo">
</p>

Lumber is a CLI tool that helps you create your backend application in minutes.
At its core, Lumber has been designed with a modular architecture that leverages a set of plugins.

For example, it takes one command to get a REST API, a GraphQL API or a fully operational Admin Panel.

## Install

```sh
npm install -g lumber-cli
```

## Plugins

|Plugin                                                                  | Description                                                                                |
|------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
|[lumber-forestadmin](https://github.com/ForestAdmin/lumber-forestadmin) | Install Forest Admin to get an off-the-shelf admin panel based on a highly-extensible API. |
|[lumber-graphql](https://github.com/ForestAdmin/lumber-graphql)         | Generate a GraphQL API.                                                                    |
|[lumber-jwt](https://github.com/ForestAdmin/lumber-jwt)                 | Add a JWT authentication middleware.                                                       |

## Commands

`$ lumber [command]`

- `generate <appName>`      generate a backend application with an ORM/ODM configured.
- `update`        update your models's definition according to your database schema
- `install <package>`       install a Lumber plugin.
- `run <plugin:cmd>` run a command from a Lumber plugin.
- `help [cmd]`    display help for [cmd]

## License
[GPL](https://github.com/ForestAdmin/Lumber/blob/master/LICENSE)

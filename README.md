# Lumber

<p align="center">
  <img src="https://github.com/ForestAdmin/lumber/blob/master/assets/lumber-logo.png?raw=true" alt="Lumber logo">
</p>

Lumber is a CLI tool that helps you create your backend application in minutes.
At its core, Lumber has been designed with a modular architecture that leverages a set of plugins.

For example, it takes one command to get a REST API, a GraphQL API or a fully operational Admin Panel.

## Install

```sh
npm install -g lumber-cli -s
```

## Plugins

|Plugin                                                                  | Description                                                                                |
|------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
|[lumber-forestadmin](https://github.com/ForestAdmin/lumber-forestadmin) | Install Forest Admin to get an off-the-shelf admin panel based on a highly-extensible API. |
|[lumber-graphql](https://github.com/ForestAdmin/lumber-graphql)         | Generate a GraphQL API.                                                                    |
|[lumber-jwt](https://github.com/ForestAdmin/lumber-jwt)                 | Add a JWT authentication middleware.                                                       |

## See it in action

```
$ npm install -g lumber-cli -s
$ lumber generate -c postgres://erlich:aviato@localhost:5432/meals Meals

$ cd Meals/ && npm install -s
$ npm start

Your application is listening on port 3000.
```

Finally, visit http://localhost:3000.

## Commands

`$ lumber [command]`

- `generate <appName>`      generate a backend application with an ORM/ODM configured.
- `update`        update your models's definition according to your database schema
- `install <package>`       install a Lumber plugin.
- `run <plugin:cmd>` run a command from a Lumber plugin.
- `help [cmd]`    display help for [cmd]

## Contribute

To publish the docker image:
```sh
docker build -t forestadmin/lumber .
docker login
docker push forestadmin/lumber
```

## Community

👇 Join our Slack community of +1000 developers

[![Slack Status](http://community.forestadmin.com/badge.svg)](https://community.forestadmin.com)

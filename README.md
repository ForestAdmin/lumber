# Lumber: The Admin Interface Framework

<p align="center">
  <img src="https://github.com/ForestAdmin/Lumber/blob/master/assets/lumber-logo.png?raw=true" alt="Lumber logo">
</p>

Lumber is an opensource tool to generate an admin microservice. It instantly provides all common admin tasks such as CRUD operations, simple chart rendering, user group management, and WYSIWYG interface editor. That’s what makes Lumber a quick and easy solution to get your admin interface started.

- [Install](#install)
- [Usage](#usage)
- [Deploy to production](#deploy-to-production)

## Install

`$ npm install -g lumber-cli`

NOTICE:
- You may need to use `sudo` depending on your platform.

## Usage

- [Quickstart](#quickstart)
- [List of commands](#commands)
- [Documentation](#documentation)

### Quickstart
`$ lumber generate`

NOTICE:

- Your database credentials **are safe**. They are only stored in the Lumber
  generated microservice.
- You may need to use the option `--ssl` if your database uses a SSL
  connection.
- You can specify the hostname and the port on which your admin will be running
  by using the option `--hostname` and `--port`.

![Example](/assets/console.gif "Example")

Full demo video: https://www.youtube.com/watch?v=2cKSsBxrvR8

### Commands

`$ lumber [command]`

- `generate`      generate your admin microservice
- `user`          show your current logged user
- `login`         sign in to your account
- `logout`        sign out of your account
- `action`        create a new action button on your admin
- `heroku-deploy` deploy your admin on production

### Documentation

https://doc.forestadmin.com/developer-guide/lumber.html

#### Watch video:

[![heroku-deploy-video](https://img.youtube.com/vi/pEQ9Ro3UeKY/0.jpg)](https://www.youtube.com/watch?v=pEQ9Ro3UeKY)

## License
[GPL](https://github.com/ForestAdmin/Lumber/blob/master/LICENSE)

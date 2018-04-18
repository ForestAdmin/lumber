# Lumber: The Admin Interface Framework

<p align="center">
  <img src="https://github.com/ForestAdmin/Lumber/blob/master/assets/lumber-logo.png?raw=true" alt="Lumber logo">
</p>

Lumber is an opensource tool to generate an admin microservice. It instantly provides all common admin tasks such as CRUD operations, simple chart rendering, user group management, and WYSIWYG interface editor. That’s what makes Lumber a quick and easy solution to get your admin interface started.

- [Install](#install)
- [Usage](#usage)
- <a href="https://doc.forestadmin.com/developer-guide/lumber.html#deploying-to-production" target="_blank">Deploy to production</a>

## Install

`$ npm install -g lumber-cli`

NOTICE:
- You may need to use `sudo` depending on your platform.

## Usage

- [Quickstart](#quickstart)
- [Documentation](#documentation)
- [List of commands](#commands)

### Quickstart
`$ lumber generate`

NOTICE:

- Your database credentials **are safe**. They are only stored in the Lumber
  generated microservice.

![Example](/assets/console.gif "Example")

Full demo video: https://www.youtube.com/watch?v=2cKSsBxrvR8

### Documentation

https://doc.forestadmin.com/developer-guide/lumber.html

### Commands

`$ lumber [command]`

- `generate`      generate your admin microservice
- `user`          show your current logged user
- `login`         sign in to your account
- `logout`        sign out of your account

## License
[GPL](https://github.com/ForestAdmin/Lumber/blob/master/LICENSE)

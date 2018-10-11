# Lumber

<p align="center">
  <img src="https://github.com/ForestAdmin/Lumber/blob/master/assets/lumber-logo.png?raw=true" alt="Lumber logo">
</p>

Lumber generates automatically the back office of your web app. It is
completely **backend agnostic** and use your SQL database schema to create a
**REST API** that provides all common back office features such as CRUD, search
& filters, analytics, user permissions as well as providing a user-friendly
**UI**.

Lumber has been designed with scalability in mind to fit requirements from **small projects** to **mature companies**.

- [Install](#install)
- [Usage](#usage)
- <a href="https://doc.forestadmin.com/developer-guide/lumber.html#deploying-to-production" target="_blank">Deploy to production</a>

## Install

    npm install -g lumber-cli

NOTICE: You may need to use `sudo` depending on your platform.

## Usage

- [Quickstart](#quickstart)
- [Documentation](#documentation)
- [List of commands](#commands)

### Quickstart
    lumber generate

NOTICE:

- Your database credentials **are safe**. They are only stored in your
  Lumber-generated back office.

![Example](/assets/console.gif "Example")

Full demo video: https://www.youtube.com/watch?v=2cKSsBxrvR8

### Documentation

[https://doc.forestadmin.com/developer-guide/lumber.html](https://doc.forestadmin.com/developer-guide/lumber.html)

### Commands

`$ lumber [command]`

- `generate`      generate the back office of your web application based on the database schema
- `update`        update your models's definition according to your database schema
- `deploy`        deploy your back office application to production
- `user`          show your current logged user
- `login`         sign in to your Forest account
- `logout`        sign out of your Forest account
- `help [cmd]`    display help for [cmd]

## License
[GPL](https://github.com/ForestAdmin/Lumber/blob/master/LICENSE)

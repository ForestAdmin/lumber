# Lumber: The Admin Interface Framework

<p align="center">
  <img src="https://github.com/ForestAdmin/Lumber/blob/master/assets/lumber-logo.png?raw=true" alt="Lumber logo">
</p>

Lumber is an opensource tool to generate an admin microservice.
It serves a REST API hooked directly into your database (MySQL, Postgres and SQL Server for
now).

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
- [Adding relationships](#relationships)
- [Creating actions](#actions)

### Quickstart
`$ lumber generate`

NOTICE:

- Your database credentials **are safe**. They are only stored in the Lumber generated microservice.
- You may need to use the option `--ssl` if your database uses a SSL
connection.

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

### Advanced

#### Relationships

As Lumber generates an admin microservice from the database schema, it only
creates `belongsTo` relationships, based on all your foreign keys.
Please note that some ORMs do not create foreign key constraints. This means
that in some cases, you will have to add `belongsTo` relationships manually.
Lastly, as databases don't have the notion of inverse relationships, you will
need to add `hasMany` or `hasOne` relationships manually.

The generated admin microservice uses the ORM
[Sequelize](https://github.com/sequelize/sequelize). Check out their
[documentation](http://docs.sequelizejs.com/en/latest/docs/models-definition)
for advanced model customization.


**Adding `belongsTo` relationships**

Open the model file you want in the `models` directory and declare the
belongsTo relationship in the `associate` function.

Syntax:

    Model.belongsTo(<targetModel>, {
      foreignKey: '<foreignKey>',
      // ...
    ));

Available options can be found in the [Sequelize
documentation](http://docs.sequelizejs.com/en/v3/api/associations/#belongstotarget-options).

Example:

```js
module.exports = (sequelize, DataTypes) => {
  let models = sequelize.models;

  var Model = sequelize.define('users', {
    // ...
  }, {
    classMethods: {
      associate: () => {
        // BelongsTo relationships
        Model.belongsTo(models.addresses);
      }
    },
    // ...
  });

  return Model;
};
```


**Adding inverse of relationships (`hasOne`, `hasMany`, …)**

Open the model file you want in the `models` directory and declare the
`hasMany` (`hasOne` is very similar) relationship in the `associate` function.

Syntax:
```js
Model.hasMany(<targetModel>, {
  // [options]
  // ...
));
```

Available options can be found in the [Sequelize
documentation](http://docs.sequelizejs.com/en/v3/api/associations/#hasmanytarget-options).


```js
module.exports = (sequelize, DataTypes) => {
  let models = sequelize.models;

  var Model = sequelize.define('users', {
    // ...
  }, {
    classMethods: {
      associate: () => {
        // hasMany relationships
        Model.hasMany(models.books);

        // hasOne relationships
        Model.hasOne(models.car);
      }
    },
    // ...
  });

  return Model;
};
```
#### Actions

Common actions such as CRUD, sort or search are implemented by default.
You will probably want to provide your admin with actions to perform operations
that are specific to your application. Moderating comments, logging into a
customer’s account (a.k.a impersonate) or banning a user are typical examples
of specific actions.

The following command will **automatically** generate an `approve` action on
the `comments` collection.

```
$ lumber action comments approve
```

**Declaration:** `/forest/comments.js`

```js
'use strict';
var liana = require('forest-express-sequelize');

liana.collection('comments', {
  actions: [
    { name: 'approve' },
  ]
});
```

**Implementation:** `/routes/comments.js` (customize the business logic here).

```js
'use strict';
var express = require('express');
var router = express.Router();
var liana = require('forest-express-sequelize');

router.post('/actions/approve', liana.ensureAuthenticated,
  (req, res) => {
    // Your business logic here.

    res.send({
      success: 'Comments successfully approved!'
    });
  });

module.exports = router;
```

## Deploy to production

Lumber provides the command `heroku-deploy` to push your local admin interface
to your Production environment.

1. [Create a new Github repository](https://help.github.com/articles/create-a-repo/).
2. Push your generated admin microservice on your new Github repository.
3. Ensure you have a [Heroku](https://signup.heroku.com) (free) account and the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-command-line#download-and-install) installed.
4. Login to your Heroku account using the command-line: `$ heroku login`.
5. 🎉 Deploy your admin microservice on production: `$ lumber heroku-deploy -c`. 🎉

### Watch video:

[![heroku-deploy-video](https://img.youtube.com/vi/pEQ9Ro3UeKY/0.jpg)](https://www.youtube.com/watch?v=pEQ9Ro3UeKY)

## License
[GPL](https://github.com/ForestAdmin/Lumber/blob/master/LICENSE)


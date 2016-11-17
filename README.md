# Lumber: The admin microservice generator

<p align="center">
  <img src="https://github.com/ForestAdmin/Lumber/blob/master/assets/lumber-logo.png?raw=true" alt="Lumber logo">
</p>

Lumber is an opensource tool to generate an admin microservice.
It serves a REST API hooked directly into your database (MySQL and Postgres for
now).

DISCLAIMER: Lumber is a project from [Forest](http://www.forestadmin.com).
Your Lumber-generated app gives you a free pass to all the powerful features of
Forest, as per our Hacker plan.

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

First, you need to create a new Github repository and push your generated admin code
on it.

```
$ git init
$ git add -A
$ git commit -m "Generate my admin microservice"
$ git remote add origin git@github.com:<YOUR_GITHUB_USER>/<YOUR_REPOSITORY_NAME>.git
$ git push -u origin master
```

Second, you need to have a [Heroku](https://signup.heroku.com) account.

Third, install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-command-line#download-and-install) and login using `$ heroku login`.

Lastly you're ready to run `$ lumber heroku-deploy`. 🎉

![heroku-deploy-img](/assets/heroku-deploy.png "heroku-deploy")

## License
[GPL](https://github.com/ForestAdmin/Lumber/blob/master/LICENSE)


# Lumber
[![npm package](https://badge.fury.io/js/lumber-cli.svg)](https://badge.fury.io/js/lumber-cli)
[![Build Status](https://github.com/ForestAdmin/lumber/workflows/Build,%20Test%20and%20Deploy/badge.svg?branch=master)](https://github.com/ForestAdmin/lumber/actions)
[![Test Coverage](https://api.codeclimate.com/v1/badges/eecf0efe8bd429975ae0/test_coverage)](https://codeclimate.com/github/ForestAdmin/lumber/test_coverage)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

<p align="center">
  <img src="https://github.com/ForestAdmin/lumber/blob/master/assets/logo-forestadmin.png?raw=true" alt="Forest Admin logo">
</p>

Lumber is the CLI tool used to install [Forest Admin](https://www.forestadmin.com), the Admin Panel framework.
Forest Admin has been designed with scalability in mind to fit requirements from small projects to mature companies.

- [Getting started](#getting-started)
- [How it works](#how-it-works)
- [Documentation](#documentation)
- [Features](#features)
- [Commands](#commands)
- [See it in action](https://app.forestadmin.com/23065?livedemo)
- [Who Uses Forest Admin](#who-uses-forest-admin)
- [Contribute](#contribute)
- [Community](#community)

## Getting started

Get your admin panel running in minutes by installing Forest Admin:
[https://app.forestadmin.com/signup](https://app.forestadmin.com/signup)

## How it works

<p align="center" style="margin: 60px 0">
  <img width="100%" src="https://forest-assets.s3.amazonaws.com/Github+README+assets/howitworks.png" alt="Howitworks">
</p>

Forest Admin consists of two components:
- The Admin Frontend is the user interface where you'll manage your data and configuration.
- The Admin Backend API hosted on your servers where you can find and extend your data models and all the business logic (routes, actions, …) related to your admin panel.

## Documentation
[https://docs.forestadmin.com/documentation/](https://docs.forestadmin.com/documentation/)

## Features

### CRUD

All of your CRUD operations are natively supported. The API automatically
supports your data models' validation and allows you to easily extend or
override any API routes' with your very own custom logic.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/crud.jpeg" alt="CRUD">

### Search & Filters

Forest Admin has a built-in search allowing you to run basic queries to
retrieve your application's data. Set advanced filters based on fields and
relationships to handle complex search use cases.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/search+filters.jpeg" alt="Search and Filters">

### Sorting & Pagination

Sorting and pagination features are natively handled by the Admin API. We're
continuously optimizing how queries are run in order to display results faster
and reduce the load of your servers.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/sorting+pagination.jpeg" alt="Sorting and Pagination">

### Custom action

A custom action is a button which allows you to trigger an API call to execute
a custom logic. With virtually no limitations, you can extend the way you
manipulate data and trigger actions (e.g. refund a customer, apply a coupon,
ban a user, etc.)

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/custom+actions.jpeg" alt="Sorting and Pagination">

### Export

Sometimes you need to export your data to a good old fashioned CSV. Yes, we
know this can come in handy sometimes :-)

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/exports.jpeg" alt="Export">

### Segments

Get in app access to a subset of your application data by doing a basic search
or typing an SQL query or implementing an API route.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/segments.jpeg" alt="Segments">

### Dashboards

Forest Admin is able to tap into your actual data to chart out your metrics
using a simple UI panel, a SQL query or a custom API call.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/dashboards.jpeg" alt="Dashboard">

### WYSIWYG

The WYSIWYG interface saves you a tremendous amount of frontend development
time using drag'n'drop as well as advanced widgets to build customizable views.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/wysiwyg.jpeg" alt="WYSIWYG">

### Custom HTML/JS/CSS

Code your own views using JS, HTML, and CSS to display your application data in
a more appropriate way (e.g. Kanban, Map, Calendar, Gallery, etc.).

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/smart+views.jpeg" alt="Custom views">

### Team-based permissions

Without any lines of code, manage directly from the UI who has access or can
act on which data using a team-based permission system.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/teams.jpeg" alt="Team based permissions">

### Third-party integrations

Leverage data from third-party services by reconciling it with your
application’s data and providing it directly to your Admin Panel. All your
actions can be performed at the same place, bringing additional intelligence to
your Admin Panel and ensuring consistency.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/integrations.jpeg" alt="Third-party integrations">

### Notes & Comments

Assign your teammates to specific tasks, leave a note or simply comment a
record, thereby simplifying collaboration all across your organization.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/notes+comments.jpeg" alt="Notes and Comments">

### Activity logs

Monitor each action executed and follow the trail of modification on any data
with an extensive activity log system.

<img src="https://forest-assets.s3.amazonaws.com/Github+README+assets/activity+logs.jpeg" alt="Activity logs">

## Commands

`$ lumber [command]`

- `generate <appName>`      generate a backend application with an ORM/ODM configured.
- `login`                   log into Forest Admin API.
- `logout`                  log out from Forest Admin API.
- `help [cmd]`              display help for [cmd]

## Who Uses Forest Admin
- [Apartmentlist](https://www.apartmentlist.com)
- [Carbon Health](https://carbonhealth.com)
- [Ebanx](https://www.ebanx.com)
- [First circle](https://www.firstcircle.ph)
- [Forest Admin](https://www.forestadmin.com) of course :-)
- [Heetch](https://www.heetch.com)
- [Lunchr](https://www.lunchr.co)
- [Pillow](https://www.pillow.com)
- [Qonto](https://www.qonto.com)
- [Raspberry PI](https://www.raspberrypi.org/)
- [Shadow](https://shadow.tech)
- And hundreds more…

## Contribute

To publish the docker image:
```sh
docker build -t forestadmin/lumber .
docker login
docker push forestadmin/lumber
```

## Community

👇 Join our Developers community for support and more

[![Discourse developers community](https://img.shields.io/discourse/posts?label=discourse&server=https%3A%2F%2Fcommunity.forestadmin.com)](https://community.forestadmin.com)

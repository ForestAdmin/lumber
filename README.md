# Lumber
[![npm package](https://badge.fury.io/js/lumber-cli.svg)](https://badge.fury.io/js/lumber-cli)
[![Build Status](https://travis-ci.org/ForestAdmin/lumber.svg?branch=devel)](https://travis-ci.org/ForestAdmin/lumber)
![Coverage](https://img.shields.io/badge/coverage-81%25%0A-critical)

<p align="center">
  <img src="https://github.com/ForestAdmin/lumber/blob/master/assets/lumber-logo.png?raw=true" alt="Lumber logo">
</p>

Lumber is the CLI tool used to install [Forest Admin](https://www.forestadmin.com), the Admin Panel framework.
Forest Admin has been designed with scalability in mind to fit requirements from small projects to mature companies.

## Getting started

Get your admin panel running in minutes by installing Forest Admin:
[https://app.forestadmin.com/signup](https://app.forestadmin.com/signup)

## See it in action

Check out our Live demo to see what Forest Admin looks like in practice:
[https://app.forestadmin.com/23065?livedemo](https://app.forestadmin.com/23065?livedemo)

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
- [Qonto](https://www.qonto.eu)
- [Raspberry PI](https://www.raspberrypi.org/)
- [Shadow](https://shadow.tech)
- And hundreds more…

## Documentation
[https://docs.forestadmin.com/documentation/](https://docs.forestadmin.com/documentation/)

## Features

### CRUD
All of your CRUD operations are natively supported. The API automatically
supports your data models' validation and allows you to easily extend or
override any API routes' with your very own custom logic.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/crud.jpg" alt="CRUD">

### Search & Filters
Forest Admin has a built-in search allowing you to run basic queries to
retrieve your application's data. Set advanced filters based on fields and
relationships to handle complex search use cases.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/search.jpg" alt="Search and Filters">

### Sorting & Pagination
Sorting and pagination features are natively handled by the Admin API. We're
continuously optimizing how queries are run in order to display results faster
and reduce the load of your servers.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/sorting.jpg" alt="Sorting and Pagination">

### Smart action
A smart action is a button which allows you to trigger an API call to execute
a custom logic. With virtually no limitations, you can extend the way you
manipulate data and trigger actions (e.g. refund a customer, apply a coupon,
ban a user, etc.)

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/custom.jpg" alt="Sorting and Pagination">

### Export
Sometimes you need to export your data to a good old fashioned CSV. Yes, we
know this can come in handy sometimes :-)

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/export.jpg" alt="Export">

### Segments
Get in app access to a subset of your application data by doing a basic search
or typing an SQL query or implementing an API route.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/segments.jpg" alt="Segments">

### Dashboards
Forest Admin is able to tap into your actual data to chart out your metrics
using a simple UI panel, a SQL query or a custom API call.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/dashboard.jpg" alt="Dashboard">

### WYSIWYG
The WYSIWYG interface saves you a tremendous amount of frontend development
time using drag'n'drop as well as advanced widgets to build customizable views.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/wysiwyg.jpg" alt="WYSIWYG">

### Custom HTML/JS/CSS
Code your own views using JS, HTML, and CSS to display your application data in
a more appropriate way (e.g. Kanban, Map, Calendar, Gallery, etc.).

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/customhtml.jpg" alt="Custom views">

### Team-based permissions
Without any lines of code, manage directly from the UI who has access or can
act on which data using a team-based permission system.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/team.jpg" alt="Team based permissions">

### Third-party integrations
Leverage data from third-party services by reconciling it with your
application’s data and providing it directly to your Admin Panel. All your
actions can be performed at the same place, bringing additional intelligence to
your Admin Panel and ensuring consistency.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/integration.jpg" alt="Third-party integrations">

### Notes & Comments
Assign your teammates to specific tasks, leave a note or simply comment a
record, thereby simplifying collaboration all across your organization.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/notes.jpg" alt="Notes and Comments">

### Activity logs
Monitor each action executed and follow the trail of modification on any data
with an extensive activity log system.

<img src="https://www.forestadmin.com/public/img/illustrations-dev/screens/activity.jpg" alt="Activity logs">

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

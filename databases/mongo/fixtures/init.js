db.createCollection("films");
db.createCollection("persons");

db.persons.insertMany([
  {
    "_id" : ObjectId("5db19df01434e27ed6420daa"),
    "title" : "terminator",
    "personId" : ObjectId("5db19dfc1434e27ed6420dad"),
    "actors" : [
      ObjectId("5db19dfc1434e27ed6420dad"),
      ObjectId("5db19e0d1434e27ed6420dd0"),
    ]
  },
  {
    "_id" : ObjectId("5db19e0d1434e27ed6420dd0"),
    "name" : "Aksel"
  },
  {
    "_id" : ObjectId("5db1b7101434e27ed64211c9"),
    "name" : "person one"
  },
  {
    "_id" : ObjectId("5db1b71c1434e27ed64211cf"),
    "name" : "person two"
  },
  {
    "_id" : ObjectId("5db1b7241434e27ed64211d3"),
    "name" : "person three"
  }
]);

db.films.insertMany([
  {
    "_id" : ObjectId("5db19df01434e27ed6420daa"),
    "title" : "terminator",
    "personId" : ObjectId("5db19dfc1434e27ed6420dad"),
    "actors" : [
      ObjectId("5db19dfc1434e27ed6420dad"),
      ObjectId("5db19e0d1434e27ed6420dd0"),
      "blabla"
    ]
  },
  {
    "_id" : ObjectId("5db19df01434e27ed6420dab"),
    "title" : "fight club",
    "personId" : ObjectId("5db19dfc1434e27ed6420dad"),
    "actors" : [
      ObjectId("5db19e0d1434e27ed6420dd0")
    ]
  },
  {
    "_id" : ObjectId("5db19df01434e27ed6420dac"),
    "title" : "l'histoire sans fin",
    "personId" : ObjectId("5db19dfc1434e27ed6420dad"),
    "actors" : [
      ObjectId("5db1b7101434e27ed64211c9")
    ]
  },
  {
    "_id" : ObjectId("5db19df01434e27ed6420dad"),
    "title" : "matrix",
    "personId" : null,
    "actors" : [
      ObjectId("5db19e0d1434e27ed6420dd0")
    ]
  },
  {
    "_id" : ObjectId("5db19df01434e27ed6420dae"),
    "title" : "WOWOWOW NO PERSON ID",
    "actors" : [
      ObjectId("5db19e0d1434e27ed6420dd0"),
      ObjectId("5db19dfc1434e27ed6420dad")
    ]
  },
  {
    "_id" : ObjectId("5db19df01434e27ed6420daf"),
    "title" : "NULL PERSON ID",
    "personId" : null,
    "actors" : [
      ObjectId("5db19e0d1434e27ed6420dd0")
    ]
  }
]);

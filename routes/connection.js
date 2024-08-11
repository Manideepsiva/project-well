

const { MongoClient } = require('mongodb');


//const dbURI = 'mongodb://localhost:27017/project';
const uri = 'mongodb://localhost:27017';

// Database Name
const dbName = 'project';
var count = 0;

// Collection Name
const collectionName = 'hospital';

// Connect to MongoDB
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async client => {
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    module.exports = collection;


  });






const uri = 'mongodb://localhost:27017';
const dbName = 'project';
const { MongoClient } = require('mongodb');
let db;
let hospcoll;
let appointmentcoll;



async function hello() {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        const db = client.db(dbName);
        hospcoll = db.collection('hospital');
        appointmentcoll = db.collection('appointment');

        return { hospcoll, appointmentcoll}; 
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}


module.exports = {hello};
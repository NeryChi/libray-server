require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');

// Usar la variable de entorno
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

module.exports = client;

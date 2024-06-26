const client = require("./dbconection");

/**
 * Inserta datos en una colección específica de MongoDB.
 * 
 * @param {string} dbName - Nombre de la base de datos.
 * @param {string} collectionName - Nombre de la colección.
 * @param {Object[]} data - Array de objetos a insertar.
 */
async function insertData({ dbName, collectionName, data }) {
  try {
    // Conectar al cliente MongoDB
    await client.connect();
    console.log("Conectado a MongoDB.");

    // Acceder a la base de datos y a la colección especificada
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Insertar datos
    const result = await collection.insertMany(data);
    console.log(`Documentos insertados: ${result.insertedCount}`);
  } catch (e) {
    console.error(e);
  } finally {
    // Cerrar la conexión
    await client.close();
  }
}

module.exports = insertData;
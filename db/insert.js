const client = require("./dbconection");

/**
 * Inserta datos en una colección específica de MongoDB.
 * 
 * @param {string} dbName - Nombre de la base de datos.
 * @param {string} collectionName - Nombre de la colección.
 * @param {Object} data - Objeto con las propiedades `package` e `imports` a insertar.
 */
async function insertData({ dbName, collectionName, data }) {
  try {
    // Conectar al cliente MongoDB
    await client.connect();
    console.log("Conectado a MongoDB.");

    // Acceder a la base de datos y a la colección especificada
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Convertir el objeto `data` en un array de un solo documento para insertMany
    const dataArray = [data];

    // Insertar datos
    const result = await collection.insertMany(dataArray);
    console.log(`Documentos insertados: ${result.insertedCount}`);
  } catch (e) {
    console.error(e);
  } finally {
    // Cerrar la conexión
    await client.close();
  }
}

module.exports = insertData;

const client = require("./dbconection");


/**
 * Consulta documentos en una colección específica de MongoDB.
 * 
 * @param {string} dbName - Nombre de la base de datos.
 * @param {string} collectionName - Nombre de la colección.
 * @param {Object} query - Objeto de consulta para filtrar los documentos.
 * @param {Object} [projection] - Objeto opcional para especificar los campos a retornar.
 * @returns {Promise<Object[]>} - Promesa que resuelve con los documentos encontrados.
 */
async function selectData({ dbName, collectionName, query, projection = {} }) {
  try {
    // Conectar al cliente MongoDB
    await client.connect();
    console.log("Conectado a MongoDB.");

    // Acceder a la base de datos y a la colección especificada
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Realizar la consulta
    const documents = await collection.find(query, { projection }).toArray();
    return documents;
  } catch (e) {
    console.error(e);
    throw e; // Re-lanzar para manejo externo
  } finally {
    // Cerrar la conexión
    await client.close();
  }
}

module.exports = selectData;

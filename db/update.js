const client = require("./dbconection");

/**
 * Actualiza datos en una colección específica de MongoDB.
 * 
 * @param {string} dbName - Nombre de la base de datos.
 * @param {string} collectionName - Nombre de la colección.
 * @param {Object} query - Objeto de consulta para encontrar el documento a actualizar.
 * @param {Object} updateData - Objeto con los datos a actualizar.
 */
async function updateData({ dbName, collectionName, query, updateData }) {
  try {
    // Conectar al cliente MongoDB
    await client.connect();

    // Acceder a la base de datos y a la colección especificada
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Obtener el documento actual
    const currentDocument = await collection.findOne(query);

    // Si el documento no existe, insertarlo
    if (!currentDocument) {
      const result = await collection.insertOne(updateData);
      return 'inserted';
    }

    // Actualizar el documento existente con los nuevos datos
    const result = await collection.updateOne(query, { $set: updateData });

    if (result.modifiedCount > 0) {
      return 'updated';
    } else {
      return 'updated'; // Mantener este valor de retorno como en tu código original
    }
  } catch (e) {
    throw new Error(`Error al actualizar datos: ${e.message}`);
  } finally {
    // Cerrar la conexión
    await client.close();
  }
}

module.exports = updateData;

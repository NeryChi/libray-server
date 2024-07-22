const selectData = require('../db/select');

/**
 * Elimina nodos duplicados anidados del árbol.
 * 
 * @param {Object} node - Nodo a procesar.
 * @returns {Object} - Nodo procesado sin duplicados.
 */
function removeDuplicateNodes(node) {
  if (typeof node !== 'object' || node === null) {
    return node;
  }

  const keys = Object.keys(node);
  for (const key of keys) {
    if (key === 'componentInfo') {
      continue; // No procesar más allá del nodo componentInfo
    }
    if (typeof node[key] === 'object' && node[key] !== null) {
      node[key] = removeDuplicateNodes(node[key]);

      // Si el nodo hijo tiene el mismo nombre que el nodo padre, aplanar la estructura
      if (node[key] && typeof node[key] === 'object' && node[key][key]) {
        node[key] = node[key][key];
      }
    }
  }
  return node;
}

/**
 * Recupera todos los documentos de la colección de un usuario y retorna los datos procesados.
 * 
 * @param {Object} params - Parámetros para la función.
 * @param {string} params.collectionName - Nombre de la colección (usuario).
 * @returns {Array} - Datos procesados sin nodos duplicados anidados.
 */
async function getComponentsInDb({ collectionName }) {
  const dbName = 'library-server';
  const query = {}; // Recuperar todos los documentos
  const projection = {}; // Ajusta tu proyección según sea necesario

  try {
    const rawData = await selectData({ dbName, collectionName, query, projection });
    const data = Array.isArray(rawData) ? rawData : [rawData];

    if (data.length === 0) {
      throw new Error('No se encontraron datos en la base de datos');
    }

    const processedData = data.map(doc => {
      const correctedData = removeDuplicateNodes(doc.imports);
      return { ...doc, imports: correctedData };
    });

    return processedData;
  } catch (e) {
    console.error('Error al recuperar los datos:', e);
    throw e;
  }
}

// Exportar la función para que pueda ser utilizada en otros módulos
module.exports = { getComponentsInDb };

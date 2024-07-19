const fs = require('fs');
const path = require('path');
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
 * Recupera los componentes de la base de datos y retorna los datos procesados.
 * 
 * @param {Object} params - Parámetros para la función.
 * @param {string} params.packageName - Nombre del paquete a recuperar.
 * @returns {Object} - Datos procesados sin nodos duplicados anidados.
 */
async function getComponentsInDb({ packageName = 'abc' }) {
  const dbName = 'library-server';
  const collectionName = packageName;
  const query = {}; // Ajusta tu consulta según sea necesario
  const projection = {}; // Ajusta tu proyección según sea necesario

  try {
    const rawData = await selectData({ dbName, collectionName, query, projection });
    const data = Array.isArray(rawData) && rawData.length > 0 ? rawData[0] : rawData;

    if (!data || !data.imports) {
      throw new Error('Datos inválidos recuperados de la base de datos');
    }

    const correctedData = removeDuplicateNodes(data.imports);
    return { ...data, imports: correctedData };
  } catch (e) {
    console.error('Error al recuperar los datos:', e);
    throw e;
  }
}

// Exportar la función para que pueda ser utilizada en otros módulos
module.exports = { getComponentsInDb };

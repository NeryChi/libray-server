// getComponentsInDb.js
const fs = require('fs');
const path = require('path');
const selectData = require('../db/select');

/**
 * Guarda los datos en un archivo JSON.
 * 
 * @param {string} filePath - Ruta del archivo donde se guardarán los datos.
 * @param {Object[]} data - Datos a guardar.
 */
function saveDataToJson(filePath, data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf-8');
    console.log(`Datos guardados en ${filePath}`);
  } catch (e) {
    console.error('Error al guardar los datos en JSON:', e);
    throw e;
  }
}

/**
 * Recupera los componentes de la base de datos y los guarda en un archivo JSON.
 */
async function getComponentsInDb({ packegeName = 'react-icons'}) {
  const dbName = 'library-server';
  const collectionName = packegeName;
  const query = {}; // Ajusta tu consulta según sea necesario
  const projection = {}; // Ajusta tu proyección según sea necesario

  try {
    const data = await selectData({ dbName, collectionName, query, projection });
    const filePath = path.join(__dirname, 'data.json');
    saveDataToJson(filePath, data);
  } catch (e) {
    console.error('Error al recuperar y guardar los datos:', e);
  }
}

getComponentsInDb({ packegeName: '@mui' }).catch(console.error);

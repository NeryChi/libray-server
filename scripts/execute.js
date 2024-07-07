const fs = require('fs');
const path = require('path');
const { scanComponents } = require("./findR");
const { scanComponentsExec } = require("./testComponents");
const insertData = require('../db/insert');

const packageName = '@mui';  // Cambiar según el paquete a analizar

async function updateComponentsInDb(packageName) {
  // Intentar encontrar componentes con análisis estático
  const foundComponents = scanComponents({ packageName });

  let componentsData = {};

  if (Object.keys(foundComponents).length === 0) {
    console.log('No se encontraron componentes de React en el paquete especificado con análisis estático.');
    // Intentar encontrar componentes con ejecución dinámica
    const foundComponentsExec = scanComponentsExec({ packageName });
    if (Object.keys(foundComponentsExec).length > 0) {
      console.log('Se encontraron componentes de React usando el método de ejecución.');
      componentsData = formatForMongoDB(foundComponentsExec, packageName);
    } else {
      console.log('No se encontraron componentes de React usando el método de ejecución.');
    }
  } else {
    console.log('Se encontraron componentes de React usando el método de análisis estático.');
    componentsData = formatForMongoDB(foundComponents, packageName);
  }

  // Insertar datos en MongoDB si se encontraron componentes
  if (Object.keys(componentsData).length > 0) {
    const dataForInsertion = {
      dbName: "library-server",
      collectionName: packageName,
      data: componentsData
    };

    await insertData(dataForInsertion);
    console.log(`Datos de componentes guardados para ${packageName}.`);
  }
}

function formatForMongoDB(componentsByPath, nombrePropiedad) {
  return [{
    package: nombrePropiedad,
    imports: Object.entries(componentsByPath).map(([path, components]) => ({
      path,
      components: Array.from(components)  // Asegurar que es un array
    }))
  }];
}

updateComponentsInDb(packageName).catch(console.error);

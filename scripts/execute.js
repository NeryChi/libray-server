const fs = require('fs');
const path = require('path');
const insertData = require('../db/insert');

const packageName = '@mui';  // Cambiar según el paquete a analizar

async function updateComponentsInDb(packageName) {
  // Intentar encontrar componentes con análisis estático
  const foundComponents = scanComponents({ packageName });

  let componentsData = {};

  if (foundComponents.length > 0) {
    componentsData = formatForMongoDB(foundComponents, packageName);
  } else {
    console.log(`No se encontraron componentes de React en el paquete ${packageName}.`);
    return; // No hay componentes para guardar y se cancela la operacion.
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

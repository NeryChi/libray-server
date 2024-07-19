const fs = require('fs');
const path = require('path');
const insertData = require('../db/insert');

const packageName = 'antd';  // Cambiar según el paquete a analizar

async function setComponentsInDb(packageName) {
  try {
    // Importar el módulo ES dinámicamente
    const { findComponents } = await import('./findComponents.mjs');

    // Intentar encontrar componentes con análisis estático
    const foundComponents = await findComponents({ packageName });

    // Verificar si hubo un error en el análisis de componentes
    if (typeof foundComponents === 'string') {
      return foundComponents; // Retornar el mensaje de error de análisis de componentes
    } else if (foundComponents.length === 0) {
      const noComponentsMessage = `Error SCIDB_003: No se encontraron componentes para el paquete '${packageName}'.`;
      return noComponentsMessage;
    }

    const componentsTree = buildComponentsTree(foundComponents, packageName);

    const componentsData = {
      package: packageName,
      imports: componentsTree
    };

    // Insertar datos en MongoDB si se encontraron componentes
    const dataForInsertion = {
      dbName: "library-server",
      collectionName: packageName,
      data: componentsData  // Pasar el objeto directamente
    };

    await insertData(dataForInsertion);
    const successMessage = `Datos de componentes guardados para ${packageName}.`;
    return successMessage;

  } catch (error) {
    const errorMessage = `Error SCIDB_001: Error al establecer los componentes en la base de datos para el paquete '${packageName}': ${error.message}`;
    console.error(errorMessage);
    return errorMessage;
  }
}

function buildComponentsTree(components, packageName) {
  const tree = {};

  components.forEach(({ path: componentPath, componentInfo }) => {
    const segments = componentPath.split('/');
    
    // Eliminar el primer segmento si es igual a packageName
    if (segments[0] === packageName) {
      segments.shift();
    }

    let current = tree;

    segments.forEach((segment, index) => {
      // Remover la extensión .js del último segmento
      if (index === segments.length - 1) {
        segment = segment.replace('.js', '');
        if (!current[segment]) {
          current[segment] = {
            path: componentPath,
            componentInfo
          };
        }
      } else {
        if (!current[segment]) {
          current[segment] = {};
        }
        current = current[segment];
      }
    });
  });

  return tree;
}

setComponentsInDb(packageName).then(result => {
  console.log(result);
}).catch(error => {
  console.error(`Error SCIDB_002: Error en la ejecución principal: ${error.message}`);
});

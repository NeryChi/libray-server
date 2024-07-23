const updateData = require('../db/update');

/**
 * Configura y actualiza los componentes en la base de datos.
 * 
 * @param {Object} params - Parámetros para la función.
 * @param {string} params.collectionName - Nombre de la colección que corresponde al usuario.
 * @param {string} params.packageName - Nombre del paquete a analizar.
 * @param {string} params.version - Versión de la librería.
 * @returns {string} - Mensaje de éxito o error.
 */
async function setComponentsInDb({ collectionName, packageName, version }) {
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
      version: version,
      imports: componentsTree
    };

    // Verificar si el documento ya existe y decidir si se debe actualizar o insertar
    const query = { package: packageName };
    const updateResult = await updateData({
      dbName: "library-server",
      collectionName,
      query,
      updateData: componentsData
    });

    if (updateResult === 'inserted') {
      return `Inserción correcta para ${packageName} (versión ${version}).`;
    } else if (updateResult === 'updated') {
      return `Actualización correcta para ${packageName} (versión ${version}).`;
    } else {
      return `No se realizaron cambios en el documento`;
    }

  } catch (error) {
    const errorMessage = `Error SCIDB_001: Error al establecer los componentes en la base de datos para el paquete '${packageName}': ${error.message}`;
    console.error(errorMessage);
    return errorMessage;
  }
}

/**
 * Construye un árbol de componentes a partir de los datos encontrados.
 * 
 * @param {Array} components - Lista de componentes encontrados.
 * @param {string} packageName - Nombre del paquete.
 * @returns {Object} - Árbol de componentes.
 */
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

// Llamada a la función principal con los parámetros correspondientes
setComponentsInDb({ collectionName: 'nery', packageName: '@fluentui/react-components', version: 'v3.0.2' }).then(result => {
  console.log(result);
}).catch(error => {
  console.error(`Error SCIDB_002: Error en la ejecución principal: ${error.message}`);
});

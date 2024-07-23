const fs = require('fs');
const path = require('path');
const { getComponentsInDb } = require('./getComponentsInDb');  // Asegúrate de que la ruta es correcta

/**
 * Genera un objeto Libraries a partir de los componentes de una colección.
 * 
 * @param {Object} params - Parámetros para la función.
 * @param {string} params.collectionName - Nombre de la colección a recuperar.
 */
async function generateLibraries({ collectionName }) {
  try {
    const librariesObject = {};

    // Obtener los datos de los paquetes desde la colección
    const packagesData = await getComponentsInDb({ collectionName });

    for (const pkgData of packagesData) {
      const componentsData = pkgData.imports;

      /**
       * Procesa los componentes para generar el objeto Libraries.
       * 
       * @param {Object} node - Nodo a procesar.
       * @param {string} parentPath - Ruta del padre.
       */
      function processComponents(node, parentPath) {
        for (const key in node) {
          if (node.hasOwnProperty(key)) {
            const value = node[key];

            if (value.path && value.componentInfo) {
              const importPath = value.path;
              const libraryPath = `./${importPath.replace('.js', '')}`;
              librariesObject[libraryPath] = importPath;
            } else {
              processComponents(value, `${parentPath}/${key}`);
            }
          }
        }
      }

      processComponents(componentsData, '');
    }

    const librariesFileContent = `const Libraries = ${JSON.stringify(librariesObject, null, 2)};

module.exports = Libraries;
`;

    // Ajuste de la ruta del archivo final
    const filePath = path.join(__dirname, '..', 'src', 'components', 'libraries.js');
    fs.writeFileSync(filePath, librariesFileContent, 'utf-8');
    console.log(`Libraries generados y guardados en ${filePath}`);
  } catch (error) {
    console.error(`Error al generar las libraries: ${error.message}`);
  }
}

// Llama a la función generateLibraries con el nombre de la colección deseada
generateLibraries({ collectionName: 'nery' }).catch(error => {
  console.error(`Error al generar las importaciones: ${error.message}`);
});

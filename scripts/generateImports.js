const fs = require('fs');
const path = require('path');
const { getComponentsInDb } = require('./getComponentsInDb');  // Asegúrate de que la ruta es correcta

/**
 * Genera importaciones y un objeto estructurado a partir de los componentes de un paquete.
 * 
 * @param {Object} params - Parámetros para la función.
 * @param {string} params.packageName - Nombre del paquete a recuperar.
 */
async function generateImports({ packageName }) {
  try {
    const componentsData = await getComponentsInDb({ packageName });

    const imports = [];
    const componentsObject = {};

    /**
     * Procesa los componentes para generar las importaciones y el objeto estructurado.
     * 
     * @param {Object} node - Nodo a procesar.
     * @param {string} parentPath - Ruta del padre.
     * @param {Object} currentObject - Objeto actual en el que se almacenan los componentes.
     */
    function processComponents(node, parentPath, currentObject) {
      for (const key in node) {
        if (node.hasOwnProperty(key)) {
          const value = node[key];

          if (value.path && value.componentInfo) {
            const importPath = value.path;
            const importName = key + parentPath.replace(/\//g, '_');

            if (value.componentInfo.type && value.componentInfo.type === 'batch') {
              imports.push(`import * as ${importName} from '${importPath}';`);
            } else {
              imports.push(`import ${importName} from '${importPath}';`);
            }

            const segments = parentPath.split('/').filter(segment => segment !== '');
            let current = componentsObject;
            segments.forEach(segment => {
              if (!current[segment]) {
                current[segment] = {};
              }
              current = current[segment];
            });

            if (!current[key]) {
              current[key] = importName;
            }
          } else {
            if (!currentObject[key]) {
              currentObject[key] = {};
            }
            processComponents(value, `${parentPath}/${key}`, currentObject[key]);
          }
        }
      }
    }

    processComponents(componentsData.imports, '', componentsObject);

    const importsFileContent = `${imports.join('\n')}

export const Libraries = {
  "${packageName}": ${generateStringFromObject(componentsObject)}
};
`;

    const filePath = path.join(__dirname, 'imports.js');
    fs.writeFileSync(filePath, importsFileContent, 'utf-8');
    console.log(`Imports generados y guardados en ${filePath}`);
  } catch (error) {
    console.error(`Error al generar los imports: ${error.message}`);
  }
}

/**
 * Genera una cadena a partir de un objeto, manteniendo las referencias correctas.
 * 
 * @param {Object} obj - Objeto a procesar.
 * @returns {string} - Cadena representando el objeto.
 */
function generateStringFromObject(obj) {
  const isObject = val => typeof val === 'object' && !Array.isArray(val);

  const recurse = (obj, indent = '  ') => {
    const entries = Object.entries(obj).map(([key, value]) => {
      const processedKey = `"${key}"`;
      if (isObject(value)) {
        return `${indent}${processedKey}: ${recurse(value, indent + '  ')}`;
      }
      return `${indent}${processedKey}: ${value}`;
    });
    return `{\n${entries.join(',\n')}\n${indent.slice(2)}}`;
  };

  return recurse(obj);
}

// Llama a la función generateImports con el paquete deseado
generateImports({ packageName: 'react-icons' }).catch(console.error);

import path from 'path';
import fs from 'fs-extra';
import { parse } from 'react-docgen';

function formatPath(fullPath) {
  const nodeModulesIndex = fullPath.lastIndexOf('node_modules');
  if (nodeModulesIndex === -1) {
    return fullPath;
  }
  return fullPath.slice(nodeModulesIndex + 'node_modules/'.length).replace(/\\/g, '/');
}

function getDisplayNameFromPath(filePath) {
  const fileName = path.basename(filePath, path.extname(filePath));
  return fileName;
}

async function parseTypeScriptDeclarations(filePath, output) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const componentDeclarations = content.match(/export declare const (\w+): \w+;/g);

    if (componentDeclarations) {
      const formattedPath = path.dirname(formatPath(filePath)); // Usar path.dirname para obtener la carpeta contenedora
      const folderName = path.basename(formattedPath); // Obtener el nombre de la carpeta contenedora

      const exports = componentDeclarations.map(declaration => {
        const componentName = declaration.match(/export declare const (\w+): \w+;/)[1];
        const componentPath = formatPath(filePath).replace('index.d.ts', `${componentName}.js`);
        return {
          name: componentName,
          path: componentPath,
        };
      });

      const componentInfo = {
        description: 'Paquete grande de exportación de componentes de React',
        displayName: folderName,
        props: {},
        type: 'batch', // Añadimos la propiedad 'type' para indicar que es un lote de exportaciones
        exports // Añadimos la lista de exportaciones
      };

      output.push({ path: formattedPath, componentInfo });
    }
  } catch (error) {
    console.error(`Error FC-004: Error al analizar las declaraciones TypeScript en el archivo ${filePath}: ${error.message}`);
    throw error;
  }
}

async function scanDirectory(dir, output) {
  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await scanDirectory(fullPath, output);
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const formattedPath = formatPath(fullPath);

          try {
            const componentInfo = parse(content);

            // Ajuste para corregir el displayName si es necesario
            componentInfo.forEach(component => {
              if (component.displayName === 'ForwardRef') {
                component.displayName = getDisplayNameFromPath(fullPath);
              }
              output.push({ path: formattedPath, componentInfo: component });
            });

          } catch (error) {
            // Continuar la ejecución aunque ocurra un error en un componente específico
          }
        } catch (error) {
          console.error(`Error FC-006: Error al leer el archivo ${fullPath}: ${error.message}`);
          // Continuar la ejecución aunque ocurra un error al leer un archivo específico
        }
      }
    }
  } catch (error) {
    console.error(`Error FC-003: Error al escanear el directorio ${dir}: ${error.message}`);
    throw error;
  }
}

async function scanDirectoryForDeclarations(dir, output) {
  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await scanDirectoryForDeclarations(fullPath, output);
      } else if (file === 'index.d.ts') {
        try {
          await parseTypeScriptDeclarations(fullPath, output);
        } catch (error) {
          console.error(`Error FC-007: Error al analizar las declaraciones TypeScript en el archivo ${fullPath}: ${error.message}`);
          // Continuar la ejecución aunque ocurra un error al analizar un archivo específico
        }
      }
    }
  } catch (error) {
    console.error(`Error FC-008: Error al escanear el directorio para declaraciones en ${dir}: ${error.message}`);
    throw error;
  }
}

async function findComponents({ packageName }) {
  if (!packageName || typeof packageName !== 'string') {
    return 'Error FC-002: El nombre del paquete es erróneo.';
  }

  const packagePath = path.resolve('node_modules', packageName);
  const output = [];

  try {
    await scanDirectory(packagePath, output);

    // Si no se encontraron componentes con react-docgen, intentar parsear index.d.ts
    if (output.length === 0) {
      await scanDirectoryForDeclarations(packagePath, output);
    }

    if (output.length === 0) {
      const message = `Error FC-003: El paquete '${packageName}' no es una biblioteca de React válida (no se encontraron componentes).`;
      console.log(message);
      return message;
    }

    return output;
  } catch (error) {
    const errorMessage = `Error FC-001: Error al analizar el paquete '${packageName}'.`;
    console.error(errorMessage, error);
    return errorMessage;
  }
}

// Exportar la función findComponents para ser utilizada en otros módulos
export { findComponents };

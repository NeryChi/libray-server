const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const packageName = '@mui';  // Ejemplo de paquete

// Función mejorada para verificar si un directorio contiene archivos JS con exportaciones válidas
function hasImportableFiles(directory) {
  const files = fs.readdirSync(directory);
  return files.some(file => {
    const fullPath = path.join(directory, file);
    return (file.endsWith('.js') || file.endsWith('.jsx')) && fileHasExports(fullPath);
  });
}

// Función para obtener solo los directorios con exportaciones válidas
function getExportableDirectories(srcPath) {
  let exportableDirs = [];

  function findExportableDirs(dir) {
    const subDirs = fs.readdirSync(dir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => path.join(dir, dirent.name));

    // Comprobar si algún subdirectorio o el propio dir contiene archivos exportables
    if (hasImportableFiles(dir) || subDirs.some(subDir => hasImportableFiles(subDir))) {
      exportableDirs.push(dir);
    }

    // Recursivamente verificar cada subdirectorio
    subDirs.forEach(findExportableDirs);
  }

  findExportableDirs(srcPath);
  return exportableDirs;
}

// Generar exportaciones desde una lista de directorios válidos
function generateExports(packageName) {
  const rootPath = path.join(__dirname, `../node_modules/${packageName}`);
  const directories = getExportableDirectories(rootPath);

  const exportStatements = directories.map(dir => {
    const relativePath = path.relative(rootPath, dir).replace(/\\/g, '/');
    return `export * from '${packageName}/${relativePath}';`;
  }).join('\n');

  return exportStatements;
}

// Función para actualizar index.js
function updateIndexFile(pkgName, exportStatements) {
  const indexPath = path.join(__dirname, '../src/components/index.js');
  fs.appendFileSync(indexPath, exportStatements);
  console.log(`Archivo index.js actualizado con:\n${exportStatements}`);
}

// Función para verificar si un archivo contiene exportaciones válidas
function fileHasExports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Verifica si hay exportaciones concretas
    const validExportRegex = /export\s+(?:\{[^}]*\}|default\s+[^\s;]+)/;
    const isProxyOrErrorHandling = /new\s+Proxy\s*\(|throw new Error\s*\(/;

    // Chequear si contiene exportaciones válidas y no es un manejador de errores o proxy
    if (isProxyOrErrorHandling.test(content)) {
      return false; // Ignora archivos que son solo configuraciones o manejadores de errores
    }

    // Asegurar que las exportaciones son válidas
    return validExportRegex.test(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error}`);
    return false;
  }
}


// Proceso principal
async function main() {
  try {
    const exportStatements = generateExports(packageName);
    updateIndexFile(packageName, exportStatements);
  } catch (error) {
    console.error('Error durante el proceso de generación de exportaciones:', error);
  }
}

main();

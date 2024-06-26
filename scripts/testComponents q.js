const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const React = require('react');
const { render, cleanup } = require('@testing-library/react');

// Configurar jsdom
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

global.window = window;
global.document = window.document;
global.navigator = { userAgent: 'node.js' };

// Almacenar componentes encontrados
let componentsData = {};

// Función para determinar si un archivo es un módulo de React
function testReactComponent(Component, componentName, fullPath) {
  try {
    render(React.createElement(Component, {}));
    console.log(`${componentName} is a valid React component.`);
    const directory = path.normalize(path.dirname(fullPath));
    if (!componentsData[directory]) {
      componentsData[directory] = [];
    }
    componentsData[directory].push(componentName);
    cleanup(); // Limpia después de cada render para ahorrar memoria
  } catch (error) {
    console.error(`${componentName} is not a valid React component. Error: ${error.message}`);
  }
}

// Función para procesar un lote de archivos
function processBatch(batch, basePath) {
  batch.forEach(file => {
    const fullPath = path.join(basePath, file.name);
    if (file.isDirectory()) {
      scanDirectory(fullPath); // Recursividad en subdirectorios
    } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
      try {
        delete require.cache[require.resolve(fullPath)]; // Borra la caché para ahorrar memoria
        const Module = require(fullPath);
        if (Module) {
          Object.keys(Module).forEach(key => {
            if (typeof Module[key] === 'function') {
              testReactComponent(Module[key], key, fullPath);
            }
          });
        }
      } catch (error) {
        console.error(`Error loading module ${fullPath}: ${error.message}`);
      }
    }
  });
}

// Función para explorar recursivamente los directorios y buscar componentes de React
function scanDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  let batch = [];

  files.forEach((file, index) => {
    batch.push(file);
    if (batch.length >= 10 || index === files.length - 1) { // Procesar cada 10 archivos o al final del directorio
      processBatch(batch, directory);
      batch = []; // Resetear el lote después de procesarlo
    }
  });
}

// Ejemplo de uso
const packageName = 'react-icons';  // Cambiar según el paquete a analizar
const packagePath = path.join(__dirname, '..', 'node_modules', packageName);
scanDirectory(packagePath);

// Guardar los componentes en un archivo JSON
const jsonOutput = Object.keys(componentsData).map(directory => ({
  path: directory,
  componentes: componentsData[directory]
}));

fs.writeFileSync('componentsData.json', JSON.stringify({ [packageName.split('/').pop()]: jsonOutput }, null, 2));
console.log('Component data has been saved to componentsData.json');

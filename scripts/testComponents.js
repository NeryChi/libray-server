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

function testReactComponent(Component, componentName, fullPath, componentsData) {
  try {
    render(React.createElement(Component, {}));
    // console.log(`${componentName} is a valid React component.`);
    const normalizedPath = path.normalize(fullPath);
    const directory = path.dirname(normalizedPath);
    const baseNodeModulesPath = path.join(__dirname, '..', 'node_modules');
    let relativePath = path.relative(baseNodeModulesPath, directory);
    relativePath = relativePath.replace(/\\/g, '/');  // Reemplazar backslashes con forward slashes
    if (!componentsData[relativePath]) {
      componentsData[relativePath] = [];
    }
    componentsData[relativePath].push(componentName);
    cleanup(); // Limpia después de cada render para ahorrar memoria
  } catch (error) {
    console.error(`${componentName} is not a valid React component. Error: ${error.message}`);
  }
}

function processBatch(batch, basePath, componentsData) {
  batch.forEach(file => {
    const fullPath = path.join(basePath, file.name);
    if (file.isDirectory()) {
      scanDirectory(fullPath, componentsData);
    } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
      try {
        delete require.cache[require.resolve(fullPath)];
        const Module = require(fullPath);
        if (Module) {
          Object.keys(Module).forEach(key => {
            if (typeof Module[key] === 'function') {
              testReactComponent(Module[key], key, fullPath, componentsData);
            }
          });
        }
      } catch (error) {
        console.error(`Error loading module ${fullPath}: ${error.message}`);
      }
    }
  });
}

function scanDirectory(directory, componentsData) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  let batch = [];

  files.forEach((file, index) => {
    batch.push(file);
    if (batch.length >= 10 || index === files.length - 1) {
      processBatch(batch, directory, componentsData);
      batch = [];
    }
  });
}

function scanComponentsExec({ packageName }) {
  const packagePath = path.join(__dirname, '..', 'node_modules', packageName);
  let componentsData = {};
  scanDirectory(packagePath, componentsData);
  return componentsData;
}

module.exports = { scanComponentsExec };

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function isReactComponent(fileContent) {
  const ast = parser.parse(fileContent, {
    sourceType: "module",
    plugins: ["jsx"]
  });

  let isComponent = false;
  let isExportDefault = false;
  let isImportReact = false;
  let isImportJSX = false;
  let componentName = '';

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      if (path.node.declaration && path.node.declaration.type === 'Identifier') {
        isExportDefault = true;
        componentName = path.node.declaration.name;
      }
    },
    ImportDeclaration(path) {
      if (path.node.source.value === 'react') {
        isImportReact = true;
      }
      path.node.specifiers.forEach(specifier => {
        if (specifier.imported && (specifier.imported.name === 'jsx' || specifier.imported.name === 'jsxs')) {
          isImportJSX = true;
        }
      });
    },
    VariableDeclaration(path) {
      if (path?.node?.declarations.some(declaration => declaration?.init && declaration?.init?.callee && declaration?.init?.callee?.name === 'require' && declaration?.init?.arguments[0]?.value === 'react')) {
        isImportReact = true;
        isImportJSX = true;
      }

      const initCaleeObjectName = path?.node?.declarations?.[0]?.init?.callee?.object?.name;
      const exportName = path?.node?.declarations?.[0]?.init?.arguments?.[0]?.name;

      if (initCaleeObjectName === 'React' && exportName) {
        componentName = exportName;
        isExportDefault = true;
      } else {
        isExportDefault = false;
      }
    }
  });

  return isExportDefault && isImportReact && isImportJSX ? componentName : false;
}

function scanDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  const componentsByPath = {};

  files.forEach(file => {
    const filePath = path.join(directory, file.name);
    if (file.isDirectory()) {
      const subdirComponents = scanDirectory(filePath);
      Object.keys(subdirComponents).forEach(key => {
        if (!componentsByPath[key]) {
          componentsByPath[key] = new Set();
        }
        subdirComponents[key].forEach(component => componentsByPath[key].add(component));
      });
    } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const componentName = isReactComponent(content);
      if (componentName) {
        if (!componentsByPath[directory]) {
          componentsByPath[directory] = new Set();
        }
        componentsByPath[directory].add(componentName);
      }
    }
  });

  return componentsByPath;
}

const rootDirectory = './node_modules/react-icons'; // Raíz del directorio a analizar
const foundComponents = scanDirectory(rootDirectory);

// Crear el JSON de salida
const output = Object.keys(foundComponents).reduce((acc, path) => {
  acc['@mui'] = acc['@mui'] || [];
  acc['@mui'].push({
    path: path,
    componentes: Array.from(foundComponents[path])
  });
  return acc;
}, {});

// Guardar el archivo JSON
fs.writeFileSync('foundComponents.json', JSON.stringify(output, null, 2));

console.log("Archivo JSON generado con éxito.");

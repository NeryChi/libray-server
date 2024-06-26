const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function isReactComponent(fileContent) {
  const ast = parser.parse(fileContent, {
    sourceType: "module",
    plugins: ["jsx"]
  });

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

function scanComponents({ packageName }) {
  const rootDirectory = path.join(__dirname, '..', 'node_modules', packageName);
  const files = fs.readdirSync(rootDirectory, { withFileTypes: true });
  const componentsByPath = {};

  files.forEach(file => {
    const filePath = path.join(rootDirectory, file.name);
    if (file.isDirectory()) {
      const subdirComponents = scanComponents({ packageName: path.join(packageName, file.name) });
      Object.keys(subdirComponents).forEach(key => {
        componentsByPath[key] = componentsByPath[key] || [];
        componentsByPath[key] = componentsByPath[key].concat(subdirComponents[key]);
      });
    } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const componentName = isReactComponent(content);
      if (componentName) {
        componentsByPath[rootDirectory] = componentsByPath[rootDirectory] || [];
        componentsByPath[rootDirectory].push(componentName);
      }
    }
  });

  return componentsByPath;
}

module.exports = { scanComponents };

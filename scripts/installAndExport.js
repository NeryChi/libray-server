const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const scanReactComponents = (startPath, depth = 3) => {
  const components = [];

  function findReactComponents(filePath, currentDepth) {

    if (currentDepth > depth) return;
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(filePath);
      for (const file of files) {
        findReactComponents(path.join(filePath, file), currentDepth + 1);
      }
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        const ast = parser.parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'classProperties', 'exportDefaultFrom', 'exportNamespaceFrom']
        });

        traverse(ast, {
          enter(path) {
  
            
            // Tu condicional existente para encontrar componentes
            if ((path.node.type === 'ClassDeclaration' && path.node.superClass && ['Component', 'PureComponent'].includes(path.node.superClass.name))
                || (path.node.type === 'VariableDeclarator' && path.node.init && path.node.init.type === 'CallExpression' && path.node.init.callee.name === 'forwardRef')
                || (path.node.type === 'ArrowFunctionExpression' && path.node.body.type === 'JSXElement')
                || (path.node.type === 'FunctionDeclaration' && path.node.body.body.some(bodyNode => bodyNode.type === 'ReturnStatement' && bodyNode.argument && bodyNode.argument.type === 'JSXElement'))) {
              console.log('Found React component:', filePath);
              components.push(filePath);
            }
          }
        });
        
      } catch (error) {
        console.error(`Error processing ${filePath}: ${error}`);
      }
    }
  }

  findReactComponents(startPath, 0);
  return components;
};

const components = scanReactComponents('./node_modules/@mui', 3);
console.log('Found React components:', components);

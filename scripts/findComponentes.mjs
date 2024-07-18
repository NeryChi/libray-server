import path from 'path';
import fs from 'fs-extra';
import { parse } from 'react-docgen';

const packagePath = path.resolve('node_modules', 'react-icons'); // Cambia esto según sea necesario
const outputPath = path.resolve('output', 'components.json');

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
  const content = await fs.readFile(filePath, 'utf8');
  const iconDeclarations = content.match(/export declare const (\w+): IconType;/g);
  
  if (iconDeclarations) {
    iconDeclarations.forEach(declaration => {
      const iconName = declaration.match(/export declare const (\w+): IconType;/)[1];
      const formattedPath = formatPath(filePath).replace('index.d.ts', `${iconName}.js`);
      const componentInfo = {
        description: 'React Icon Component',
        displayName: iconName,
        props: {}
      };
      output.push({ path: formattedPath, componentInfo });
    });
  }
}

async function scanDirectory(dir, output) {
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
          // Si no se puede parsear con react-docgen, no hacer nada aquí
        }
      } catch (error) {
        // console.warn(`Error parsing file ${fullPath}: ${error.message}`);
      }
    }
  }
}

async function main() {
  const output = [];
  await scanDirectory(packagePath, output);

  // Si no se encontraron componentes con react-docgen, intentar parsear index.d.ts
  if (output.length === 0) {
    await scanDirectoryForDeclarations(packagePath, output);
  }

  await fs.outputJson(outputPath, output, { spaces: 2 });
  console.log(`Components info saved to ${outputPath}`);
}

async function scanDirectoryForDeclarations(dir, output) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await scanDirectoryForDeclarations(fullPath, output);
    } else if (file === 'index.d.ts') {
      await parseTypeScriptDeclarations(fullPath, output);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

import path from 'path';
import fs from 'fs-extra';
import { parse } from 'react-docgen';

const reactIconsPath = path.resolve('node_modules', '@mui');
const outputPath = path.resolve('output', 'react-icons-components.json');

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
        // Detectar y manejar componentes de react-icons
        if (content.includes('GenIcon')) {
          const componentInfo = {
            description: 'React Icon Component',
            displayName: file.replace(/\.[^/.]+$/, ''),
            props: {}
          };
          output.push({ path: fullPath, componentInfo });
        } else {
          const componentInfo = parse(content);
          output.push({ path: fullPath, componentInfo });
        }
      } catch (error) {
        // console.warn(`Error parsing file ${fullPath}: ${error.message}`);
      }
    }
  }
}

async function main() {
  const output = [];
  await scanDirectory(reactIconsPath, output);
  await fs.outputJson(outputPath, output, { spaces: 2 });
  console.log(`Components info saved to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

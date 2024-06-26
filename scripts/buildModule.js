const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra'); // Necesitas instalar este paquete, npm install fs-extra

const indexPath = path.join(__dirname, '..', 'src', 'components', 'index.js');
const tempBuildDir = path.join(__dirname, '..', 'temp_build');
const finalBuildDir = path.join(__dirname, '..', 'dist');
let retryCount = 0;
const maxRetries = 3;

function buildModule() {
  // Asegura que el directorio temporal esté limpio antes de empezar
  fse.emptyDirSync(tempBuildDir);

  exec(`webpack --config ./webpack.config.js --output-path ${tempBuildDir}`, (error, stdout) => {
    if (error) {
      console.log('Webpack error detected, analyzing...', error, stdout);
      analyzeErrors(stdout);
    } else {
      console.log('Webpack compiled successfully');
      finalizeBuild();
    }
  });
}

function analyzeErrors(stdout) {
  const lines = stdout.split('\n');
  const failedModules = [];

  lines.forEach(line => {
    const cleanedLine = line.replace(/\x1B\[\d+m/g, '').toLowerCase();
    const match = cleanedLine.match(/can't resolve '([^']+)'/i);
    if (match && match[1]) {
      failedModules.push(match[1]);
    }
  });

  if (failedModules.length) {
    console.log('Failed modules detected:', failedModules);
    removeFailedExports(failedModules);
  } else {
    console.log('No failed modules detected, build complete.');
  }
}

function removeFailedExports(modules) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // Asegura que el contenido siempre termine con un salto de línea
  if (!indexContent.endsWith('\n')) {
    indexContent += '\n';
  }

  modules.forEach(modulePath => {
    const importRegex = new RegExp(`^export \\* from '${modulePath}';\r?\n`, 'gm');
    indexContent = indexContent.replace(importRegex, '');
  });

  indexContent = indexContent.replace(/^\s*[\r\n]/gm, '');

  fs.writeFileSync(indexPath, indexContent.trim() + '\n');
  console.log('Removed failed module exports and cleaned up empty lines.');

  if (retryCount < maxRetries) {
    retryCount++;
    console.log(`Re-running webpack (Attempt ${retryCount})...`);
    buildModule();
  } else {
    console.log('Maximum retry limit reached, please check your configuration.');
  }
}

function finalizeBuild() {
  // Mueve el contenido del directorio temporal al directorio final solo si el build es exitoso
  fse.moveSync(tempBuildDir, finalBuildDir, { overwrite: true });
  console.log(`Build successfully moved to '${finalBuildDir}'`);
}

// module.exports = buildModule;

buildModule();

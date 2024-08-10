const fs = require('fs');
const path = require('path');

// Función para escanear directorios recursivamente
function scanDirectory(dir, fileExtensions, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        scanDirectory(fullPath, fileExtensions, files);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (fileExtensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// Función principal
function main() {
  const rootDir = path.join(__dirname, 'test'); // Directorio 'test' al mismo nivel que el script
  const fileExtensions = ['.mjs', '.js', '.jsx', '.ts', '.tsx'];
  const files = scanDirectory(rootDir, fileExtensions);

  const report = {
    scannedDirectory: rootDir,
    filesFound: files,
  };

  fs.writeFileSync('scan_report.json', JSON.stringify(report, null, 2), 'utf-8');
  console.log('El informe de escaneo se ha guardado en scan_report.json');
}

// Ejecutar función principal
main();

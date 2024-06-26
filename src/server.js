const express = require('express');
const installModule = require('../scripts/installAndExport');
const cors = require('cors');
const app = express();
const port = 3000;
const morgan = require('morgan');

// Habilita el middleware para mostrar logs en consola
app.use(morgan('dev'));

// Habilita el middleware para parsear JSON
app.use(express.json());

// Habilita CORS para permitir solicitudes desde cualquier origen
app.use(cors());

// Endpoint para instalar un módulo
app.post('/install', async (req, res) => {
  const { packageName } = req.body;
  if (!packageName) {
    return res.status(400).send({ error: 'Nombre del paquete es requerido' });
  }

  try {
    await installModule(packageName);
    res.send({ message: `Instalación y configuración completadas para el paquete ${packageName}` });
  } catch (error) {
    console.error('Error al instalar el módulo:', error);
    res.status(500).send({ error: 'Error al procesar la solicitud' });
  }
});

// Configuración estática para servir archivos
app.use(express.static('dist'));

app.listen(port, () => {
  console.log(`Component server listening at http://localhost:${port}`);
});

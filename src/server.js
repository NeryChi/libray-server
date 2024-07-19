const express = require('express');

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



// Configuración estática para servir archivos
app.use(express.static('dist'));

app.listen(port, () => {
  console.log(`Component server listening at http://localhost:${port}`);
});

// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // Añadir esta importación
const { initializeDatabase } = require('./db');
const cursosRoutes = require('./routes/cursos');
const gruposRoutes = require('./routes/grupos');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de healthcheck (IMPORTANTE: añadir antes de otras rutas)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Rutas API
app.use('/api/cursos', cursosRoutes);
app.use('/api/grupos', gruposRoutes);

// Servir archivos estáticos de React
app.use(express.static(path.join(__dirname, '../build')));

// Ruta catch-all para el enrutamiento del lado del cliente de React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// Iniciar servidor inmediatamente, sin esperar a la BD
app.listen(PORT, () => {
  console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});

// Intentar inicializar la base de datos después
initializeDatabase()
  .then(() => {
    console.log('Base de datos inicializada correctamente');
  })
  .catch(error => {
    console.error('Error inicializando base de datos:', error);
    // El servidor seguirá funcionando incluso si la BD falla
  });

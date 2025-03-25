// server/server.js
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db');
const cursosRoutes = require('./routes/cursos');
const gruposRoutes = require('./routes/grupos');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/cursos', cursosRoutes);
app.use('/api/grupos', gruposRoutes);

// Inicializar base de datos y luego iniciar servidor
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Servidor API corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();
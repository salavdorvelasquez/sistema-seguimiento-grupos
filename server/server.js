// server.js - Adaptado para PostgreSQL en Render
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 8080;

// Importar el módulo de base de datos PostgreSQL
const db = require('./db');

// Configuración básica
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://sistema-seguimiento-grupos-8lmq.vercel.app',
    'https://sistema-seguimiento-grupos-frontend.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Ruta de health check para Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Ruta principal
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>API del Sistema de Seguimiento de Grupos</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; }
          .card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .endpoint { background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; margin: 5px 0; }
          .success { color: #28a745; }
          .warning { color: #ffc107; }
        </style>
      </head>
      <body>
        <h1>API del Sistema de Seguimiento de Grupos</h1>
        <div class="card">
          <h2>Estado: <span class="success">En línea</span></h2>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Base de datos: PostgreSQL</p>
        </div>
        <div class="card">
          <h2>Endpoints disponibles:</h2>
          <div class="endpoint">GET /api/status</div>
          <div class="endpoint">GET /api/cursos</div>
          <div class="endpoint">POST /api/cursos</div>
          <div class="endpoint">GET /api/grupos</div>
          <div class="endpoint">POST /api/grupos</div>
          <div class="endpoint">PUT /api/grupos/:id/miembros</div>
          <div class="endpoint">GET /api/grupos/:id/historial</div>
          <div class="endpoint">GET /init-db</div>
          <div class="endpoint">GET /reset-db</div>
          <div class="endpoint">GET /test-db</div>
        </div>
      </body>
    </html>
  `);
});

// Ruta para inicializar la base de datos
app.get('/init-db', async (req, res) => {
  try {
    console.log('Inicialización de base de datos solicitada manualmente');
    const result = await db.initializeDatabase();
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Base de datos inicializada correctamente',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al inicializar la base de datos',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error en endpoint init-db:', error);
    res.status(500).json({
      success: false,
      message: 'Error: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta para reiniciar completamente la base de datos
app.get('/reset-db', async (req, res) => {
  try {
    console.log('Reinicio completo de base de datos solicitado manualmente');
    const result = await db.resetDatabase();
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Base de datos reiniciada correctamente',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al reiniciar la base de datos',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error en endpoint reset-db:', error);
    res.status(500).json({
      success: false,
      message: 'Error: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta para probar la conexión a la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const isConnected = await db.testConnection();
    
    if (isConnected) {
      res.status(200).json({
        success: true,
        message: 'Conexión a PostgreSQL establecida correctamente',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'No se pudo conectar a PostgreSQL',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error en endpoint test-db:', error);
    res.status(500).json({
      success: false,
      message: 'Error: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rutas API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'PostgreSQL'
  });
});

// API Cursos
app.get('/api/cursos', async (req, res) => {
  try {
    const cursos = await db.query('SELECT * FROM cursos ORDER BY nombre');
    res.json(cursos);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({ 
      error: true,
      message: 'Error al obtener cursos: ' + error.message 
    });
  }
});

app.post('/api/cursos', async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ 
        error: true,
        message: 'El nombre del curso es requerido' 
      });
    }
    
    // Verificar si ya existe un curso con ese nombre (PostgreSQL usa ILIKE para búsqueda insensible a mayúsculas/minúsculas)
    const cursosExistentes = await db.query(
      'SELECT * FROM cursos WHERE nombre ILIKE $1',
      [nombre]
    );
    
    if (cursosExistentes.length > 0) {
      return res.status(409).json({
        error: true,
        message: 'Ya existe un curso con ese nombre',
        curso: cursosExistentes[0]
      });
    }
    
    // Insertar el nuevo curso y devolver los datos insertados
    const nuevoCurso = await db.query(
      'INSERT INTO cursos (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );
    
    res.status(201).json({
      error: false,
      message: 'Curso creado exitosamente',
      curso: nuevoCurso[0]
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({ 
      error: true,
      message: 'Error al crear curso: ' + error.message 
    });
  }
});

// API Grupos
app.get('/api/grupos', async (req, res) => {
  try {
    const grupos = await db.query(`
      SELECT g.*, c.nombre as nombreCurso 
      FROM grupos g
      JOIN cursos c ON g.cursoId = c.id
      ORDER BY g.nombre
    `);
    res.json(grupos);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ 
      error: true,
      message: 'Error al obtener grupos: ' + error.message 
    });
  }
});

app.post('/api/grupos', async (req, res) => {
  try {
    const { nombre, cursoId, miembrosActuales = 0, observacion = '' } = req.body;
    
    if (!nombre || !cursoId) {
      return res.status(400).json({ 
        error: true,
        message: 'Nombre y cursoId son campos requeridos' 
      });
    }
    
    // Verificar si el curso existe
    const cursos = await db.query(
      'SELECT * FROM cursos WHERE id = $1',
      [cursoId]
    );
    
    if (cursos.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'El curso especificado no existe'
      });
    }
    
    const curso = cursos[0];
    
    // Usar transacción para garantizar la consistencia de los datos
    const resultado = await db.transaction(async (client) => {
      // Insertar el grupo y devolver los datos insertados
      const resultGrupo = await client.query(
        'INSERT INTO grupos (nombre, cursoId, curso, miembrosActuales) VALUES ($1, $2, $3, $4) RETURNING *',
        [nombre, cursoId, curso.nombre, miembrosActuales]
      );
      
      const nuevoGrupo = resultGrupo.rows[0];
      
      // Insertar el registro en el historial
      await client.query(
        'INSERT INTO historial_grupos (grupoId, miembros, observaciones) VALUES ($1, $2, $3)',
        [nuevoGrupo.id, miembrosActuales, observacion]
      );
      
      return nuevoGrupo;
    });
    
    res.status(201).json({
      error: false,
      message: 'Grupo creado exitosamente',
      grupo: resultado
    });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ 
      error: true,
      message: 'Error al crear grupo: ' + error.message 
    });
  }
});

// Actualizar miembros de un grupo
app.put('/api/grupos/:id/miembros', async (req, res) => {
  try {
    const { id } = req.params;
    const { miembrosActuales, observacion = '' } = req.body;
    
    if (miembrosActuales === undefined) {
      return res.status(400).json({ 
        error: true,
        message: 'El número de miembros es requerido' 
      });
    }
    
    // Usar transacción para garantizar la consistencia de los datos
    const resultado = await db.transaction(async (client) => {
      // Actualizar el grupo
      const resultGrupo = await client.query(
        'UPDATE grupos SET miembrosActuales = $1 WHERE id = $2 RETURNING *',
        [miembrosActuales, id]
      );
      
      if (resultGrupo.rows.length === 0) {
        throw new Error('Grupo no encontrado');
      }
      
      // Insertar el registro en el historial
      await client.query(
        'INSERT INTO historial_grupos (grupoId, miembros, observaciones) VALUES ($1, $2, $3)',
        [id, miembrosActuales, observacion]
      );
      
      return resultGrupo.rows[0];
    });
    
    res.json({
      error: false,
      message: 'Grupo actualizado exitosamente',
      grupo: resultado
    });
  } catch (error) {
    console.error('Error al actualizar grupo:', error);
    res.status(500).json({ 
      error: true,
      message: 'Error al actualizar grupo: ' + error.message 
    });
  }
});

// Obtener historial de un grupo
app.get('/api/grupos/:id/historial', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el grupo existe
    const grupos = await db.query(
      'SELECT * FROM grupos WHERE id = $1',
      [id]
    );
    
    if (grupos.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Grupo no encontrado'
      });
    }
    
    // Obtener el historial
    const historial = await db.query(
      'SELECT * FROM historial_grupos WHERE grupoId = $1 ORDER BY fecha DESC',
      [id]
    );
    
    res.json({
      error: false,
      grupo: grupos[0],
      historial
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ 
      error: true,
      message: 'Error al obtener historial: ' + error.message 
    });
  }
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ 
    error: true,
    message: 'Error interno del servidor: ' + err.message
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`🔗 Health check disponible en: http://0.0.0.0:${PORT}/health`);
  
  try {
    // Probar conexión a la base de datos al iniciar
    const isConnected = await db.testConnection();
    
    if (isConnected) {
      console.log('✅ Conexión inicial a PostgreSQL exitosa');
      
      // Inicializar la base de datos (crear tablas)
      await db.initializeDatabase();
    } else {
      console.error('❌ No se pudo establecer la conexión inicial a PostgreSQL');
      console.log('🔄 Puedes intentar inicializar manualmente visitando /init-db');
    }
  } catch (error) {
    console.error('❌ Error al inicializar:', error);
    console.log('🔄 El servidor continuará ejecutándose, pero la base de datos podría no estar disponible');
  }
});

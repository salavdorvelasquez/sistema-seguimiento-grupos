// server.js - Archivo corregido para usar db.js de manera consistente
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 8080;

// Importar el módulo de base de datos corregido
const db = require('./db');

// Configuración básica
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://sistema-seguimiento-grupos-8lmq.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Ruta de health check para Railway
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
        </div>
        <div class="card">
          <h2>Endpoints disponibles:</h2>
          <div class="endpoint">GET /api/status</div>
          <div class="endpoint">GET /api/cursos</div>
          <div class="endpoint">POST /api/cursos</div>
          <div class="endpoint">GET /api/grupos</div>
          <div class="endpoint">POST /api/grupos</div>
          <div class="endpoint">GET /init-db</div>
          <div class="endpoint">GET /test-db</div>
        </div>
      </body>
    </html>
  `);
});

// Ruta para inicializar la base de datos manualmente
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

// Ruta para probar la conexión a la base de datos
app.get('/test-db', async (req, res) => {
  try {
    const isConnected = await db.testConnection();
    
    if (isConnected) {
      res.status(200).json({
        success: true,
        message: 'Conexión a la base de datos establecida correctamente',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'No se pudo conectar a la base de datos',
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
    environment: process.env.NODE_ENV || 'development'
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
    
    // Verificar si ya existe un curso con ese nombre
    const cursosExistentes = await db.query(
      'SELECT * FROM cursos WHERE nombre = ?',
      [nombre]
    );
    
    if (cursosExistentes.length > 0) {
      return res.status(409).json({
        error: true,
        message: 'Ya existe un curso con ese nombre',
        curso: cursosExistentes[0]
      });
    }
    
    // Insertar el nuevo curso
    const result = await db.query(
      'INSERT INTO cursos (nombre) VALUES (?)',
      [nombre]
    );
    
    // Obtener el curso recién creado
    const nuevoCurso = await db.query(
      'SELECT * FROM cursos WHERE id = ?',
      [result.insertId]
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
      'SELECT * FROM cursos WHERE id = ?',
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
    const resultado = await db.transaction(async (connection) => {
      // Insertar el grupo
      const [resultGrupo] = await connection.execute(
        'INSERT INTO grupos (nombre, cursoId, curso, miembrosActuales) VALUES (?, ?, ?, ?)',
        [nombre, cursoId, curso.nombre, miembrosActuales]
      );
      
      const grupoId = resultGrupo.insertId;
      
      // Insertar el registro en el historial
      await connection.execute(
        'INSERT INTO historial_grupos (grupoId, miembros, observaciones) VALUES (?, ?, ?)',
        [grupoId, miembrosActuales, observacion]
      );
      
      // Obtener el grupo recién creado
      const [grupos] = await connection.execute(
        'SELECT * FROM grupos WHERE id = ?',
        [grupoId]
      );
      
      return grupos[0];
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
    const resultado = await db.transaction(async (connection) => {
      // Actualizar el grupo
      await connection.execute(
        'UPDATE grupos SET miembrosActuales = ? WHERE id = ?',
        [miembrosActuales, id]
      );
      
      // Insertar el registro en el historial
      await connection.execute(
        'INSERT INTO historial_grupos (grupoId, miembros, observaciones) VALUES (?, ?, ?)',
        [id, miembrosActuales, observacion]
      );
      
      // Obtener el grupo actualizado
      const [grupos] = await connection.execute(
        'SELECT * FROM grupos WHERE id = ?',
        [id]
      );
      
      if (grupos.length === 0) {
        throw new Error('Grupo no encontrado');
      }
      
      return grupos[0];
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
      'SELECT * FROM grupos WHERE id = ?',
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
      'SELECT * FROM historial_grupos WHERE grupoId = ? ORDER BY fecha DESC',
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
      console.log('✅ Conexión inicial a la base de datos exitosa');
      
      // Inicializar la base de datos (crear tablas)
      await db.initializeDatabase();
    } else {
      console.error('❌ No se pudo establecer la conexión inicial a la base de datos');
      console.log('🔄 Puedes intentar inicializar manualmente visitando /init-db');
    }
  } catch (error) {
    console.error('❌ Error al inicializar:', error);
    console.log('🔄 El servidor continuará ejecutándose, pero la base de datos podría no estar disponible');
  }
});

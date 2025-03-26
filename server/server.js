// server.js - Código completo con inicialización automática de base de datos
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const PORT = process.env.PORT || 8080;

// Configuración de middleware
app.use(cors({
  origin: '*',  // En producción, restringe a tu dominio de Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Logs para depuración
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configuración de la base de datos
const dbConfig = {
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'railway'
};

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    console.log('🔄 Iniciando inicialización de la base de datos...');
    
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a la base de datos establecida');
    
    // Crear tabla de cursos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cursos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL
      )
    `);
    console.log('✅ Tabla cursos creada/verificada');
    
    // Crear tabla de grupos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS grupos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        cursoId INT NOT NULL,
        curso VARCHAR(100) NOT NULL,
        fechaCreacion DATE NOT NULL,
        miembrosActuales INT DEFAULT 0
      )
    `);
    console.log('✅ Tabla grupos creada/verificada');
    
    // Crear tabla de historial
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS historial_grupos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grupoId INT NOT NULL,
        fecha DATE NOT NULL,
        miembros INT NOT NULL
      )
    `);
    console.log('✅ Tabla historial_grupos creada/verificada');
    
    // Insertar datos de prueba en cursos si la tabla está vacía
    const [cursoCount] = await connection.execute('SELECT COUNT(*) as count FROM cursos');
    if (cursoCount[0].count === 0) {
      console.log('🔄 Insertando datos de prueba en la tabla cursos...');
      await connection.execute(
        'INSERT INTO cursos (nombre) VALUES (?), (?), (?), (?), (?)',
        ['REVIT EN ESTRUCTURAS', 'ARQUITECTURA', 'LICENCIA', 'AUTOCAD', 'CIVIL']
      );
      console.log('✅ Datos de prueba insertados en cursos');
    }
    
    // Insertar datos de prueba en grupos si la tabla está vacía
    const [grupoCount] = await connection.execute('SELECT COUNT(*) as count FROM grupos');
    if (grupoCount[0].count === 0) {
      console.log('🔄 Insertando datos de prueba en la tabla grupos...');
      await connection.execute(
        'INSERT INTO grupos (nombre, cursoId, curso, fechaCreacion, miembrosActuales) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        ['G51', 1, 'REVIT EN ESTRUCTURAS', '2025-03-15', 131, 
         'G50', 1, 'REVIT EN ESTRUCTURAS', '2025-03-24', 20]
      );
      console.log('✅ Datos de prueba insertados en grupos');
    }
    
    await connection.end();
    console.log('🎉 Inicialización de la base de datos completada con éxito');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    return false;
  }
}

// Ruta de health check para Railway
app.get('/health', (req, res) => {
  console.log('Health check solicitado');
  res.status(200).send('OK');
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API del Sistema de Seguimiento de Grupos',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      cursos: '/api/cursos',
      grupos: '/api/grupos',
      status: '/api/status'
    }
  });
});

// Ruta de estado
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta para inicialización manual (por si acaso)
app.get('/init-db', async (req, res) => {
  console.log('Iniciando inicialización manual de la base de datos');
  const result = await initializeDatabase();
  
  if (result) {
    res.status(200).send('Base de datos inicializada correctamente.');
  } else {
    res.status(500).send('Error al inicializar la base de datos.');
  }
});

// Rutas para cursos
app.get('/api/cursos', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM cursos');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({ error: 'Error al obtener cursos' });
  }
});

app.post('/api/cursos', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del curso es requerido' });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO cursos (nombre) VALUES (?)', 
      [nombre]
    );
    await connection.end();
    
    res.status(201).json({ 
      id: result.insertId, 
      nombre,
      message: 'Curso creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({ error: 'Error al crear curso' });
  }
});

// Rutas para grupos
app.get('/api/grupos', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM grupos');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
});

app.post('/api/grupos', async (req, res) => {
  try {
    const { nombre, cursoId, curso, miembrosActuales } = req.body;
    
    if (!nombre || !cursoId || !curso) {
      return res.status(400).json({ 
        error: 'El nombre, cursoId y curso son campos requeridos' 
      });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO grupos (nombre, cursoId, curso, fechaCreacion, miembrosActuales) VALUES (?, ?, ?, NOW(), ?)',
      [nombre, cursoId, curso, miembrosActuales || 0]
    );
    
    // Obtener la fecha de creación generada
    const [fechaRow] = await connection.execute(
      'SELECT fechaCreacion FROM grupos WHERE id = ?',
      [result.insertId]
    );
    
    await connection.end();
    
    res.status(201).json({ 
      id: result.insertId, 
      nombre, 
      cursoId, 
      curso,
      fechaCreacion: fechaRow[0].fechaCreacion,
      miembrosActuales: miembrosActuales || 0,
      message: 'Grupo creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Iniciar servidor e inicializar base de datos
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
  console.log(`Health check disponible en: http://0.0.0.0:${PORT}/health`);
  
  // Inicializar la base de datos automáticamente al iniciar
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Error durante la inicialización automática:', error);
  }
});

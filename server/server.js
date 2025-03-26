// server.js - Solución completa con reconexión automática
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const PORT = process.env.PORT || 8080;

// Configuración básica
app.use(cors({
  origin: '*',
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
        </div>
      </body>
    </html>
  `);
});

// Función robusta para conectar a la base de datos con reintento
async function connectToDatabase(maxRetries = 5, retryDelay = 3000) {
  console.log('🔄 Intentando conectar a la base de datos MySQL...');
  
  // Muestra las variables de entorno disponibles (sin mostrar contraseñas)
  console.log('Variables de entorno disponibles:');
  console.log('MYSQLHOST:', process.env.MYSQLHOST);
  console.log('MYSQLUSER:', process.env.MYSQLUSER);
  console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
  console.log('MYSQLPORT:', process.env.MYSQLPORT || '3306');
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento ${attempt} de ${maxRetries}...`);
      
      const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT || 3306,
        connectTimeout: 10000, // Aumentar el tiempo de espera de conexión
        ssl: process.env.MYSQL_ATTR_SSL_CA ? {
          ca: process.env.MYSQL_ATTR_SSL_CA
        } : undefined
      });
      
      console.log('✅ Conexión a la base de datos establecida correctamente');
      return connection;
    } catch (error) {
      lastError = error;
      console.error(`❌ Error en la conexión (intento ${attempt}):`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`Esperando ${retryDelay/1000} segundos antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error(`❌ No se pudo conectar a la base de datos después de ${maxRetries} intentos.`);
  throw lastError;
}

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    // Intentar conectar a la base de datos con reintentos
    const connection = await connectToDatabase();
    
    console.log('Creando tablas si no existen...');
    
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
    
    // Verificar si las tablas tienen datos
    const [cursoCount] = await connection.execute('SELECT COUNT(*) as count FROM cursos');
    
    // Insertar datos de prueba solo si no hay datos
    if (cursoCount[0].count === 0) {
      console.log('Insertando datos de prueba en cursos...');
      await connection.execute(
        'INSERT INTO cursos (nombre) VALUES (?), (?), (?), (?), (?)',
        ['REVIT EN ESTRUCTURAS', 'ARQUITECTURA', 'LICENCIA', 'AUTOCAD', 'CIVIL']
      );
      console.log('✅ Datos de prueba insertados en cursos');
      
      console.log('Insertando datos de prueba en grupos...');
      await connection.execute(
        'INSERT INTO grupos (nombre, cursoId, curso, fechaCreacion, miembrosActuales) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        ['G51', 1, 'REVIT EN ESTRUCTURAS', '2025-03-15', 131, 
         'G50', 1, 'REVIT EN ESTRUCTURAS', '2025-03-24', 20]
      );
      console.log('✅ Datos de prueba insertados en grupos');
    } else {
      console.log('✅ Las tablas ya contienen datos, omitiendo inserción');
    }
    
    await connection.end();
    console.log('🎉 Inicialización de la base de datos completada con éxito');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    return false;
  }
}

// Ruta para inicializar la base de datos manualmente
app.get('/init-db', async (req, res) => {
  try {
    console.log('Inicialización de base de datos solicitada manualmente');
    const result = await initializeDatabase();
    
    if (result) {
      res.status(200).send('Base de datos inicializada correctamente');
    } else {
      res.status(500).send('Error al inicializar la base de datos');
    }
  } catch (error) {
    console.error('Error en endpoint init-db:', error);
    res.status(500).send('Error: ' + error.message);
  }
});

// Función auxiliar para ejecutar consultas con reconexión automática
async function executeQuery(query, params = []) {
  try {
    const connection = await connectToDatabase(3);
    const [results] = await connection.execute(query, params);
    await connection.end();
    return results;
  } catch (error) {
    console.error('Error ejecutando consulta:', query, error);
    throw error;
  }
}

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
    const cursos = await executeQuery('SELECT * FROM cursos');
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cursos: ' + error.message });
  }
});

app.post('/api/cursos', async (req, res) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del curso es requerido' });
    }
    
    const result = await executeQuery(
      'INSERT INTO cursos (nombre) VALUES (?)',
      [nombre]
    );
    
    res.status(201).json({
      id: result.insertId,
      nombre,
      message: 'Curso creado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear curso: ' + error.message });
  }
});

// API Grupos
app.get('/api/grupos', async (req, res) => {
  try {
    const grupos = await executeQuery('SELECT * FROM grupos');
    res.json(grupos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener grupos: ' + error.message });
  }
});

app.post('/api/grupos', async (req, res) => {
  try {
    const { nombre, cursoId, curso, miembrosActuales = 0 } = req.body;
    
    if (!nombre || !cursoId || !curso) {
      return res.status(400).json({ 
        error: 'Nombre, cursoId y curso son campos requeridos' 
      });
    }
    
    const result = await executeQuery(
      'INSERT INTO grupos (nombre, cursoId, curso, fechaCreacion, miembrosActuales) VALUES (?, ?, ?, CURDATE(), ?)',
      [nombre, cursoId, curso, miembrosActuales]
    );
    
    // Obtener el registro recién insertado
    const nuevoGrupo = await executeQuery(
      'SELECT * FROM grupos WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      ...nuevoGrupo[0],
      message: 'Grupo creado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear grupo: ' + error.message });
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

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
  console.log(`Health check disponible en: http://0.0.0.0:${PORT}/health`);
  
  // Iniciar la comprobación de la base de datos después de un breve retraso
  setTimeout(async () => {
    try {
      console.log('Intentando inicializar la base de datos automáticamente...');
      await initializeDatabase();
    } catch (error) {
      console.error('Error durante la inicialización automática:', error);
      console.log('Puedes intentar inicializar manualmente visitando /init-db');
    }
  }, 5000); // Esperar 5 segundos antes de intentar conectar
});

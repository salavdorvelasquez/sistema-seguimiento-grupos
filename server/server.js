// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./db');
const cursosRoutes = require('./routes/cursos');
const gruposRoutes = require('./routes/grupos');
const app = express();
const PORT = process.env.PORT || 3001;

// Logs de diagnóstico al inicio
console.log('======== INICIANDO SERVIDOR API ========');
console.log('Directorio actual:', __dirname);
console.log('Puerto configurado:', PORT);
console.log('====================================');

// Configuración CORS mejorada para permitir peticiones desde Vercel
app.use(cors({
  // Permitir peticiones desde localhost y desde el dominio de Vercel
  origin: ['http://localhost:3000', 'https://sistema-seguimiento-grupos.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Middleware para el registro de todas las solicitudes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ruta de healthcheck
app.get('/health', (req, res) => {
  console.log('Healthcheck solicitado desde:', req.ip);
  res.status(200).send('OK');
});

// Ruta de diagnóstico
app.get('/api/status', async (req, res) => {
  try {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      hostname: require('os').hostname()
    });
  } catch (error) {
    console.error('Error en ruta de estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para inicializar la base de datos y crear datos de prueba
app.get('/init-db', async (req, res) => {
  try {
    console.log('Iniciando creación de tablas e inicialización de datos...');
    const result = await initializeDatabase();
    
    // Después de crear las tablas, verificamos si están vacías e insertamos datos de prueba
    if (result) {
      try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
          host: process.env.MYSQLHOST || 'localhost',
          user: process.env.MYSQLUSER || 'root',
          password: process.env.MYSQLPASSWORD || '',
          database: process.env.MYSQLDATABASE || 'railway'
        });

        // Verificar si la tabla cursos está vacía
        const [cursoCount] = await connection.execute('SELECT COUNT(*) as count FROM cursos');
        if (cursoCount[0].count === 0) {
          console.log('Insertando datos de prueba en la tabla cursos...');
          await connection.execute(
            'INSERT INTO cursos (nombre) VALUES (?), (?), (?), (?), (?)',
            ['REVIT EN ESTRUCTURAS', 'ARQUITECTURA', 'LICENCIA', 'AUTOCAD', 'CIVIL']
          );
        }

        // Verificar si la tabla grupos está vacía
        const [grupoCount] = await connection.execute('SELECT COUNT(*) as count FROM grupos');
        if (grupoCount[0].count === 0) {
          console.log('Insertando datos de prueba en la tabla grupos...');
          await connection.execute(
            'INSERT INTO grupos (nombre, cursoId, curso, fechaCreacion, miembrosActuales) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
            ['G51', 1, 'REVIT EN ESTRUCTURAS', '2025-03-15', 131, 'G50', 1, 'REVIT EN ESTRUCTURAS', '2025-03-24', 20]
          );
        }

        await connection.end();
        console.log('✅ Datos de prueba insertados correctamente');
      } catch (dbError) {
        console.error('Error al insertar datos de prueba:', dbError);
      }
      
      console.log('✅ Tablas creadas correctamente');
      res.status(200).send('Base de datos inicializada correctamente. Tablas creadas y datos de prueba insertados.');
    } else {
      console.log('⚠️ Problema al crear tablas');
      res.status(500).send('Error al inicializar la base de datos');
    }
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    res.status(500).send('Error al inicializar la base de datos: ' + error.message);
  }
});

// Rutas API
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'API del Sistema de Seguimiento de Grupos en funcionamiento',
    endpoints: {
      status: '/api/status',
      cursos: '/api/cursos',
      grupos: '/api/grupos'
    },
    documentacion: 'Para inicializar la base de datos, visita /init-db'
  });
});

app.use('/api/cursos', cursosRoutes);
app.use('/api/grupos', gruposRoutes);

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API corriendo en puerto ${PORT} en todas las interfaces de red`);
  console.log(`Healthcheck disponible en: http://0.0.0.0:${PORT}/health`);
});

// Proceso de cierre adecuado
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

// Registrar errores no controlados
process.on('uncaughtException', (err) => {
  console.error('Error no controlado:', err);
});

// Inicializar la base de datos
initializeDatabase()
  .then((success) => {
    if (success) {
      console.log('✅ Base de datos inicializada correctamente');
    } else {
      console.log('⚠️ Servidor funcionando, pero con problemas en la base de datos');
    }
  })
  .catch(error => {
    console.error('❌ Error inicializando base de datos:', error);
  });

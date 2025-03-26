// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Agregado para verificar archivos
const { initializeDatabase } = require('./db');
const cursosRoutes = require('./routes/cursos');
const gruposRoutes = require('./routes/grupos');
const app = express();
const PORT = process.env.PORT || 3001;

// Logs de diagnóstico al inicio
console.log('======== INICIANDO SERVIDOR ========');
console.log('Directorio actual:', __dirname);
console.log('Puerto configurado:', PORT);
console.log('Variables de entorno disponibles:', Object.keys(process.env)
  .filter(key => !key.includes('PASSWORD'))
  .join(', '));
console.log('====================================');

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para el registro de todas las solicitudes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ruta de healthcheck mejorada (IMPORTANTE: añadir antes de otras rutas)
app.get('/health', (req, res) => {
  console.log('Healthcheck solicitado desde:', req.ip);
  console.log('Headers:', JSON.stringify(req.headers));
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

// Nueva ruta para forzar la inicialización de la base de datos
app.get('/init-db', async (req, res) => {
  try {
    console.log('Iniciando creación de tablas manualmente...');
    const result = await initializeDatabase();
    if (result) {
      console.log('✅ Tablas creadas correctamente');
      res.status(200).send('Base de datos inicializada correctamente. Tablas creadas.');
    } else {
      console.log('⚠️ Problema al crear tablas');
      res.status(500).send('Error al inicializar la base de datos');
    }
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    res.status(500).send('Error al inicializar la base de datos: ' + error.message);
  }
});

// Ruta raíz explícita para la API
app.get('/api', (req, res) => {
  res.status(200).send('API en funcionamiento. Accede a /health para el healthcheck.');
});

// Rutas API
app.use('/api/cursos', cursosRoutes);
app.use('/api/grupos', gruposRoutes);

// Servir archivos estáticos de React
app.use(express.static(path.join(__dirname, '../build')));

// Verificación de existencia de la carpeta build y listado de archivos
try {
  const buildDir = path.resolve(__dirname, '../build');
  if (fs.existsSync(buildDir)) {
    console.log('✅ Carpeta build encontrada en:', buildDir);
    console.log('Contenido de la carpeta build:', fs.readdirSync(buildDir));
  } else {
    console.log('⚠️ Carpeta build NO encontrada en:', buildDir);
    console.log('Contenido del directorio padre:', fs.readdirSync(path.resolve(__dirname, '..')));
  }
} catch (error) {
  console.error('Error al verificar directorio build:', error);
}

// Ruta catch-all para el enrutamiento del lado del cliente de React (con verificación)
app.get('*', (req, res) => {
  const buildPath = path.resolve(__dirname, '../build/index.html');
  console.log('Intentando servir archivo desde:', buildPath);
  
  // Verificar si el archivo existe
  if (fs.existsSync(buildPath)) {
    res.sendFile(buildPath);
  } else {
    console.error('¡Archivo index.html no encontrado en build!');
    console.log('Directorio actual:', __dirname);
    console.log('Contenido del directorio padre:', fs.readdirSync(path.resolve(__dirname, '..')));
    
    // Respuesta temporal para diagnosticar en producción
    res.status(500).send(`
      <html>
        <head><title>Error: Archivos no encontrados</title></head>
        <body>
          <h1>Error: No se encontró la aplicación React</h1>
          <p>El servidor no puede encontrar los archivos de la aplicación.</p>
          <p>Dir: ${__dirname}</p>
          <p>Contacte al administrador o verifique los logs de despliegue.</p>
        </body>
      </html>
    `);
  }
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor inmediatamente, escuchando en todas las interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor API corriendo en puerto ${PORT} en todas las interfaces de red`);
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

// Intentar inicializar la base de datos después (sin bloquear el arranque)
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
    // El servidor seguirá funcionando incluso si la BD falla
  });

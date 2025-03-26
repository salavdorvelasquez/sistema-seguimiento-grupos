// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// Ruta de healthcheck mejorada
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

// Ruta para forzar la inicialización de la base de datos
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

// Rutas API
app.get('/api', (req, res) => {
  res.status(200).send('API en funcionamiento. Accede a /health para el healthcheck.');
});
app.use('/api/cursos', cursosRoutes);
app.use('/api/grupos', gruposRoutes);

// Verificación de carpetas y archivos disponibles
console.log('🔍 Listando contenido del directorio actual:', fs.readdirSync(__dirname));
console.log('🔍 Listando contenido del directorio raíz:', fs.readdirSync(path.resolve(__dirname, '..')));

// Búsqueda avanzada de archivos estáticos
try {
  const possibleBuildPaths = [
    path.resolve(__dirname, '../build'),
    path.resolve(__dirname, '../client/build'),
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../src/build')
  ];
  
  let buildPathFound = null;
  
  // Buscar la carpeta build o public en posibles ubicaciones
  for (const buildPath of possibleBuildPaths) {
    if (fs.existsSync(buildPath)) {
      console.log(`✅ Encontrada carpeta con archivos estáticos en: ${buildPath}`);
      console.log(`📂 Contenido: ${fs.readdirSync(buildPath).join(', ')}`);
      buildPathFound = buildPath;
      break;
    } else {
      console.log(`⚠️ No se encontró carpeta en: ${buildPath}`);
    }
  }
  
  if (buildPathFound) {
    console.log(`🚀 Usando carpeta ${buildPathFound} para archivos estáticos`);
    
    // Servir archivos estáticos desde la carpeta encontrada
    app.use(express.static(buildPathFound));
    
    // Verificar si existe index.html
    const indexPath = path.join(buildPathFound, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`✅ Archivo index.html encontrado en ${indexPath}`);
      
      // Ruta catch-all para React (excepto rutas API)
      app.get('*', (req, res, next) => {
        if (req.url.startsWith('/api') || req.url === '/health' || req.url === '/init-db') {
          // Continuar al siguiente middleware si es una ruta de API
          return next();
        }
        console.log(`📄 Sirviendo index.html para ruta: ${req.url}`);
        res.sendFile(indexPath);
      });
    } else {
      console.error(`❌ No se encontró index.html en ${buildPathFound}`);
      // Implementar solución alternativa de interfaz
      implementarInterfazAlternativa(app);
    }
  } else {
    console.error('❌ No se encontró ninguna carpeta con archivos estáticos');
    // Implementar solución alternativa de interfaz
    implementarInterfazAlternativa(app);
  }
} catch (error) {
  console.error('Error al verificar directorios:', error);
  // Implementar solución alternativa de interfaz
  implementarInterfazAlternativa(app);
}

// Función para implementar la interfaz alternativa si no se encuentran archivos estáticos
function implementarInterfazAlternativa(app) {
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Sistema de Seguimiento de Grupos</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .success { color: green; }
            .error { color: red; }
            .info { color: #0066cc; }
            a { color: #0066cc; text-decoration: none; }
            a:hover { text-decoration: underline; }
            button { background: #0066cc; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0055aa; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>Sistema de Seguimiento de Grupos</h1>
          <div class="card">
            <h2>Estado del Servidor</h2>
            <p class="success">✅ API funcionando correctamente</p>
            <p>La API está funcionando correctamente, pero la interfaz de usuario no está disponible en este momento.</p>
            <p class="info">Este es un mensaje temporal mientras se resuelven problemas con los archivos estáticos de React.</p>
          </div>
          
          <div class="card">
            <h2>Acceso a la API</h2>
            <p>Puedes acceder a la API directamente en las siguientes rutas:</p>
            <ul>
              <li><a href="/api/status">/api/status</a> - Estado del servidor</li>
              <li><a href="/api/cursos">/api/cursos</a> - Lista de cursos</li>
              <li><a href="/api/grupos">/api/grupos</a> - Lista de grupos</li>
              <li><a href="/init-db">/init-db</a> - Inicializar base de datos</li>
            </ul>
          </div>
          
          <div class="card">
            <h2>Información de Diagnóstico</h2>
            <p>Directorio del servidor: ${__dirname}</p>
            <p>Directorio raíz: ${path.resolve(__dirname, '..')}</p>
            <p>Archivos en el directorio raíz: ${fs.readdirSync(path.resolve(__dirname, '..')).join(', ')}</p>
          </div>
        </body>
      </html>
    `);
  });
  
  // Ruta catch-all para otras rutas no API
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url === '/health' || req.url === '/init-db') {
      // Continuar al siguiente middleware si es una ruta de API
      return next();
    }
    res.redirect('/');
  });
}

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
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

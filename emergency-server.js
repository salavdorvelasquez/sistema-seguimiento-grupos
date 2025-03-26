// emergency-server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Registro detallado al inicio
console.log('======== INICIANDO SERVIDOR DE EMERGENCIA ========');
console.log('Información del entorno:');
console.log('- Puerto configurado:', PORT);
console.log('- Variable PORT del sistema:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Directorio actual:', process.cwd());
console.log('=================================================');

// Middleware para registro de todas las solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Ruta principal - MUY SIMPLE para garantizar que funcione
app.get('/', (req, res) => {
  console.log('Solicitud recibida en la ruta principal');
  res.send('Servidor funcionando correctamente');
});

// Ruta de healthcheck - CRÍTICA para Railway
app.get('/health', (req, res) => {
  console.log('Healthcheck solicitado');
  res.status(200).send('OK');
});

// Iniciar servidor - ASEGURANDO que escuche en TODAS las interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
});

// Manejo adecuado de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Captura de errores no controlados
process.on('uncaughtException', (err) => {
  console.error('Error no controlado:', err);
  // No cerramos el servidor, solo registramos el error
});

// emergency-server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Registro básico
console.log('==== SERVIDOR DE EMERGENCIA INICIANDO ====');
console.log('Puerto configurado:', PORT);
console.log('Fecha y hora:', new Date().toISOString());

// Ruta de healthcheck
app.get('/health', (req, res) => {
  console.log('Healthcheck solicitado');
  res.status(200).send('OK');
});

// Ruta principal
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Servidor de Emergencia</title>
        <style>
          body { font-family: Arial; padding: 30px; max-width: 800px; margin: 0 auto; }
          h1 { color: #4a3; }
          .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Servidor de Emergencia Funcionando</h1>
        <div class="card">
          <p>Este es un servidor minimalista para diagnosticar problemas de despliegue.</p>
          <p>Hora del servidor: ${new Date().toLocaleString()}</p>
        </div>
        <div class="card">
          <h3>Endpoints disponibles:</h3>
          <ul>
            <li><a href="/health">/health</a> - Verificación de estado</li>
            <li><a href="/env">/env</a> - Variables de entorno (sin valores sensibles)</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Ruta para mostrar variables de entorno (sin valores sensibles)
app.get('/env', (req, res) => {
  const envKeys = Object.keys(process.env)
    .filter(key => !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY'));
  
  res.send(`
    <html>
      <head>
        <title>Variables de Entorno</title>
        <style>
          body { font-family: Arial; padding: 30px; max-width: 800px; margin: 0 auto; }
          h1 { color: #4a3; }
          pre { background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>Variables de Entorno</h1>
        <p>Variables de entorno disponibles (sin valores sensibles):</p>
        <pre>${envKeys.join('\n')}</pre>
        <p><a href="/">← Volver</a></p>
      </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de emergencia ejecutándose en puerto ${PORT}`);
  console.log(`Healthcheck disponible en: http://0.0.0.0:${PORT}/health`);
});

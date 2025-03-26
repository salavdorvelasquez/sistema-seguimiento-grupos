const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración básica
app.use(cors({
  origin: '*',  // En producción, restringe a tu dominio de Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// Ruta de health check (crucial para Railway)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API funcionando correctamente',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rutas de API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Conexión a la base de datos
const dbConfig = {
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'railway'
};

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
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO cursos (nombre) VALUES (?)', 
      [nombre]
    );
    await connection.end();
    res.status(201).json({ id: result.insertId, nombre });
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
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO grupos (nombre, cursoId, curso, fechaCreacion, miembrosActuales) VALUES (?, ?, ?, NOW(), ?)',
      [nombre, cursoId, curso, miembrosActuales || 0]
    );
    await connection.end();
    res.status(201).json({ 
      id: result.insertId, 
      nombre, 
      cursoId, 
      curso,
      fechaCreacion: new Date().toISOString().split('T')[0],
      miembrosActuales: miembrosActuales || 0
    });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

// Inicialización de la base de datos
app.get('/init-db', async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE
    });

    // Crear tablas si no existen
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cursos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL
      )
    `);

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

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS historial_grupos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grupoId INT NOT NULL,
        fecha DATE NOT NULL,
        miembros INT NOT NULL
      )
    `);

    // Insertar datos de prueba si las tablas están vacías
    const [cursoCount] = await connection.execute('SELECT COUNT(*) as count FROM cursos');
    if (cursoCount[0].count === 0) {
      await connection.execute(
        'INSERT INTO cursos (nombre) VALUES (?), (?), (?), (?), (?)',
        ['REVIT EN ESTRUCTURAS', 'ARQUITECTURA', 'LICENCIA', 'AUTOCAD', 'CIVIL']
      );
    }

    const [grupoCount] = await connection.execute('SELECT COUNT(*) as count FROM grupos');
    if (grupoCount[0].count === 0) {
      await connection.execute(
        'INSERT INTO grupos (nombre, cursoId, curso, fechaCreacion, miembrosActuales) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
        ['G51', 1, 'REVIT EN ESTRUCTURAS', '2025-03-15', 131, 'G50', 1, 'REVIT EN ESTRUCTURAS', '2025-03-24', 20]
      );
    }

    await connection.end();
    res.send('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
    res.status(500).send('Error: ' + error.message);
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
  console.log(`Health check disponible en: http://0.0.0.0:${PORT}/health`);
});

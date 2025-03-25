// db.js
const mysql = require('mysql2/promise');

// Configuración flexible para entornos de desarrollo y producción
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // Usar localhost para desarrollo local
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Lukasadrian1998/@', // Tu contraseña local
  database: process.env.DB_DATABASE || 'seguimiento_grupos', // Nombre de la BD local
  
  // Solo usar SSL en producción
  ...(process.env.NODE_ENV === 'production' ? {
    ssl: {
      rejectUnauthorized: true
    }
  } : {}),
  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    // Crear tabla de cursos si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cursos (
        id VARCHAR(255) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        fechaCreacion DATE NOT NULL
      )
    `);
    
    // Crear tabla de grupos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grupos (
        id VARCHAR(255) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        cursoId VARCHAR(255) NOT NULL,
        curso VARCHAR(255) NOT NULL,
        fechaCreacion DATE NOT NULL,
        miembrosActuales INT NOT NULL,
        FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE CASCADE
      )
    `);
    
    // Crear tabla de historial de grupos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historial_grupos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grupoId VARCHAR(255) NOT NULL,
        fecha DATE NOT NULL,
        miembros INT NOT NULL,
        observaciones TEXT,
        FOREIGN KEY (grupoId) REFERENCES grupos(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Base de datos inicializada correctamente');
    return true;
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    throw error;
  }
}

// Función para verificar la conexión
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Función para ejecutar consultas
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
    throw error;
  }
}

// Exportar funciones y objetos
module.exports = {
  pool,
  initializeDatabase,
  testConnection,
  query
};
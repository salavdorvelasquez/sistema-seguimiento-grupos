// db.js
const mysql = require('mysql2/promise');

// Configuración con variables de entorno de Railway y fallback para desarrollo local
const pool = mysql.createPool({
  // Prioriza las variables de Railway, luego las genéricas, y por último valores locales
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'Lukasadrian1998/@',
  database: process.env.MYSQLDATABASE || process.env.DB_DATABASE || 'seguimiento_grupos',
  
  // Configuración de SSL para entornos de producción
  ...(process.env.NODE_ENV === 'production' ? {
    ssl: {
      rejectUnauthorized: false // Cambiado a false para mayor compatibilidad con Railway
    }
  } : {}),
  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para inicializar la base de datos con mejor manejo de errores
async function initializeDatabase() {
  try {
    console.log('Intentando conectar a la base de datos en:', process.env.MYSQLHOST || process.env.DB_HOST || 'localhost');
    
    // Probar la conexión primero
    await testConnection();
    
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
    // No lanzamos el error para evitar que la aplicación falle completamente
    // en caso de problemas con la base de datos
    return false;
  }
}

// Función para verificar la conexión con mejor manejo de errores
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    // Registramos información adicional para depuración
    console.error('Variables de entorno de conexión:');
    console.error('Host:', process.env.MYSQLHOST || process.env.DB_HOST || 'localhost');
    console.error('Puerto:', process.env.MYSQLPORT || process.env.DB_PORT || 3306);
    console.error('Usuario:', process.env.MYSQLUSER || process.env.DB_USER || 'root');
    console.error('Base de datos:', process.env.MYSQLDATABASE || process.env.DB_DATABASE || 'seguimiento_grupos');
    // No lanzamos el error para permitir que la aplicación siga funcionando
    return false;
  } finally {
    if (connection) connection.release();
  }
}

// Función para ejecutar consultas con mejor manejo de errores
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
    console.error('SQL:', sql);
    console.error('Parámetros:', JSON.stringify(params));
    throw error; // En este caso sí lanzamos el error para que la capa superior lo maneje
  }
}

// Exportar funciones y objetos
module.exports = {
  pool,
  initializeDatabase,
  testConnection,
  query
};

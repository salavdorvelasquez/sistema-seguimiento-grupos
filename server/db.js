// db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Asegura la carga de variables de entorno

// Configuración robusta de conexión para producción
const pool = mysql.createPool({
  host: 'mysql.railway.internal', // Host interno de MySQL proporcionado por Railway
  port: 3306, // Puerto estándar de MySQL
  user: 'root', // Usuario de MySQL
  password: 'ViXaykuYrGPCEVgKZbUTfIdUdIeLbXec', // Contraseña segura desde variables de entorno
  database: 'railway', // Nombre de la base de datos
  
  // Configuración de conexión mejorada
  connectionLimit: 10, // Tamaño del pool de conexiones
  waitForConnections: true, // Esperar conexiones disponibles
  queueLimit: 0, // Cola sin límite
  
  // Configuración SSL para conexiones seguras
  ...(process.env.NODE_ENV === 'production' ? {
    ssl: {
      rejectUnauthorized: false // Permitir certificados autofirmados en Railway
    }
  } : {})
});

// Función integral para inicializar la base de datos
async function initializeDatabase() {
  let connection;
  try {
    console.log('🚀 Iniciando conexión a la base de datos');
    console.log('📍 Detalles de conexión:');
    console.log('Host:', 'mysql.railway.internal');
    console.log('Base de datos:', 'railway');

    // Establecer y probar conexión
    connection = await pool.getConnection();
    console.log('✅ Conexión a base de datos exitosa');

    // Crear tablas con registro detallado
    await crearTablas(connection);

    console.log('🎉 Inicialización de base de datos completada');
    return true;
  } catch (error) {
    console.error('❌ Error en inicialización de base de datos:', error);
    
    // Registro detallado de errores
    console.error('Detalles del error:');
    console.error('Nombre:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    
    return false;
  } finally {
    if (connection) connection.release();
  }
}

// Función separada para crear tablas (modularidad)
async function crearTablas(connection) {
  console.log('🛠️ Creando tablas...');

  // Tabla de cursos
  await connection.query(`
    CREATE TABLE IF NOT EXISTS cursos (
      id VARCHAR(255) PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      fechaCreacion DATE NOT NULL
    )
  `);
  console.log('✓ Tabla de cursos creada/verificada');

  // Tabla de grupos
  await connection.query(`
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
  console.log('✓ Tabla de grupos creada/verificada');

  // Tabla de historial de grupos
  await connection.query(`
    CREATE TABLE IF NOT EXISTS historial_grupos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grupoId VARCHAR(255) NOT NULL,
      fecha DATE NOT NULL,
      miembros INT NOT NULL,
      observaciones TEXT,
      FOREIGN KEY (grupoId) REFERENCES grupos(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Tabla de historial de grupos creada/verificada');
}

// Función robusta para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('🔗 Prueba de conexión a base de datos exitosa');
    connection.release();
    return true;
  } catch (error) {
    console.error('🚨 Prueba de conexión a base de datos fallida:', error);
    console.error('Detalles de conexión:');
    console.error('Host:', 'mysql.railway.internal');
    console.error('Base de datos:', 'railway');
    return false;
  }
}

// Función flexible para ejecutar consultas
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Error al ejecutar consulta:', error);
    console.error('SQL:', sql);
    console.error('Parámetros:', params);
    throw error; // Relanzar para manejo en capa superior
  }
}

// Exportar funciones y pool de conexiones
module.exports = {
  pool,
  initializeDatabase,
  testConnection,
  query
};

// db.js - Archivo corregido para manejo uniforme de la conexión a la base de datos
const mysql = require('mysql2/promise');
require('dotenv').config(); // Asegura la carga de variables de entorno

// Configuración robusta de conexión para producción
// Ahora usando variables de entorno con fallback a valores hardcodeados
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'mysql.railway.internal',
  port: parseInt(process.env.MYSQLPORT || '3306'),
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'vjhtxmnqZTKevzPeVmIfvQvGtQsEXCYM',
  database: process.env.MYSQLDATABASE || 'railway',
  
  // Configuración de conexión mejorada
  connectionLimit: 10, // Tamaño del pool de conexiones
  waitForConnections: true, // Esperar conexiones disponibles
  queueLimit: 0, // Cola sin límite
  
  // Configuración SSL para conexiones seguras (solo en producción)
  ...(process.env.NODE_ENV === 'production' ? {
    ssl: {
      rejectUnauthorized: false // Permitir certificados autofirmados en Railway
    }
  } : {})
});

// Log de configuración al iniciar (sin mostrar la contraseña completa)
const dbConfig = {
  host: process.env.MYSQLHOST || 'mysql.railway.internal',
  port: parseInt(process.env.MYSQLPORT || '3306'),
  user: process.env.MYSQLUSER || 'root',
  database: process.env.MYSQLDATABASE || 'railway',
  // Mostrar solo los primeros caracteres de la contraseña por seguridad
  password: (process.env.MYSQLPASSWORD || 'vjhtxmnqZTKevzPeVmIfvQvGtQsEXCYM').substring(0, 3) + '***'
};

console.log('📊 Configuración de base de datos:', dbConfig);

// Función integral para inicializar la base de datos
async function initializeDatabase() {
  let connection;
  try {
    console.log('🚀 Iniciando conexión a la base de datos');
    
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

  // Tabla de cursos - Cambiado a INT AUTO_INCREMENT para consistencia
  await connection.query(`
    CREATE TABLE IF NOT EXISTS cursos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Tabla de cursos creada/verificada');

  // Tabla de grupos - Cambiado a INT AUTO_INCREMENT para consistencia
  await connection.query(`
    CREATE TABLE IF NOT EXISTS grupos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      cursoId INT NOT NULL,
      curso VARCHAR(255) NOT NULL,
      fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      miembrosActuales INT NOT NULL DEFAULT 0,
      FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Tabla de grupos creada/verificada');

  // Tabla de historial de grupos
  await connection.query(`
    CREATE TABLE IF NOT EXISTS historial_grupos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grupoId INT NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      miembros INT NOT NULL,
      observaciones TEXT,
      FOREIGN KEY (grupoId) REFERENCES grupos(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Tabla de historial de grupos creada/verificada');
}

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('🔗 Prueba de conexión a base de datos exitosa');
    connection.release();
    return true;
  } catch (error) {
    console.error('🚨 Prueba de conexión a base de datos fallida:', error);
    console.error('Detalles de conexión:', dbConfig);
    return false;
  }
}

// Función para ejecutar consultas
async function query(sql, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('📝 Ejecutando consulta:', sql.substring(0, 50) + (sql.length > 50 ? '...' : ''));
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Error al ejecutar consulta:', error);
    console.error('SQL:', sql);
    console.error('Parámetros:', JSON.stringify(params));
    throw error; // Relanzar para manejo en capa superior
  } finally {
    if (connection) connection.release();
  }
}

// Función para ejecutar transacciones (NUEVA)
async function transaction(callback) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Ejecutar el callback con la conexión
    const result = await callback(connection);
    
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error en transacción:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Exportar funciones y pool de conexiones
module.exports = {
  pool,
  initializeDatabase,
  testConnection,
  query,
  transaction // Exportamos la nueva función de transacción
};

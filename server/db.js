// db.js - Conexión a PostgreSQL en Render
const { Pool } = require('pg');
require('dotenv').config();

// Configuración de conexión para PostgreSQL
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'postgres',
  password: process.env.PGPASSWORD || 'password',
  port: parseInt(process.env.PGPORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Log de configuración al iniciar (sin mostrar la contraseña completa)
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  database: process.env.PGDATABASE || 'postgres',
  password: process.env.PGPASSWORD ? '***' : 'password'
};

console.log('📊 Configuración de base de datos:', dbConfig);

// Función para inicializar la base de datos
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('🚀 Iniciando conexión a la base de datos PostgreSQL');
    console.log('✅ Conexión a base de datos exitosa');

    // Crear tablas
    await crearTablas(client);
    
    console.log('🎉 Inicialización de base de datos completada');
    return true;
  } catch (error) {
    console.error('❌ Error en inicialización de base de datos:', error);
    console.error('Detalles del error:', error.message);
    return false;
  } finally {
    client.release();
  }
}

// Función para reiniciar completamente la base de datos
async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('🚨 REINICIANDO COMPLETAMENTE LA BASE DE DATOS 🚨');
    console.log('⚠️ Todas las tablas serán eliminadas y recreadas ⚠️');
    
    // Eliminar las tablas si existen (en orden inverso por las foreign keys)
    await client.query('DROP TABLE IF EXISTS historial_grupos CASCADE');
    await client.query('DROP TABLE IF EXISTS grupos CASCADE');
    await client.query('DROP TABLE IF EXISTS cursos CASCADE');
    
    console.log('✅ Todas las tablas han sido eliminadas');
    
    // Crear las tablas desde cero
    await crearTablas(client);
    
    // Insertar datos iniciales
    await insertarDatosIniciales(client);
    
    console.log('🎉 Base de datos reiniciada completamente');
    return true;
  } catch (error) {
    console.error('❌ Error al reiniciar la base de datos:', error);
    return false;
  } finally {
    client.release();
  }
}

// Función para crear tablas
async function crearTablas(client) {
  console.log('🛠️ Creando tablas...');

  // Tabla de cursos
  await client.query(`
    CREATE TABLE IF NOT EXISTS cursos (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Tabla de cursos creada/verificada');

  // Tabla de grupos
  await client.query(`
    CREATE TABLE IF NOT EXISTS grupos (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      cursoId INTEGER NOT NULL,
      curso VARCHAR(255) NOT NULL,
      fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      miembrosActuales INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Tabla de grupos creada/verificada');

  // Tabla de historial de grupos
  await client.query(`
    CREATE TABLE IF NOT EXISTS historial_grupos (
      id SERIAL PRIMARY KEY,
      grupoId INTEGER NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      miembros INTEGER NOT NULL,
      observaciones TEXT,
      FOREIGN KEY (grupoId) REFERENCES grupos(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ Tabla de historial de grupos creada/verificada');
}

// Función para insertar datos iniciales
async function insertarDatosIniciales(client) {
  console.log('📝 Insertando datos iniciales...');
  
  // Insertar cursos de ejemplo
  const cursos = [
    'REVIT EN ESTRUCTURAS',
    'ARQUITECTURA',
    'LICENCIA',
    'AUTOCAD',
    'CIVIL'
  ];
  
  for (const nombre of cursos) {
    await client.query(
      'INSERT INTO cursos (nombre) VALUES ($1)',
      [nombre]
    );
  }
  
  console.log('✓ Datos iniciales insertados');
}

// Función para probar la conexión
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('🔗 Prueba de conexión a PostgreSQL exitosa');
    return true;
  } catch (error) {
    console.error('🚨 Prueba de conexión a PostgreSQL fallida:', error);
    console.error('Detalles de conexión:', dbConfig);
    return false;
  } finally {
    if (client) client.release();
  }
}

// Función para ejecutar consultas
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    console.log('📝 Ejecutando consulta:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Error al ejecutar consulta:', error);
    console.error('SQL:', text);
    console.error('Parámetros:', JSON.stringify(params));
    throw error;
  } finally {
    client.release();
  }
}

// Función para ejecutar transacciones
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Ejecutar el callback con el cliente
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en transacción:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initializeDatabase,
  resetDatabase,
  testConnection,
  query,
  transaction
};

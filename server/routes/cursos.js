// server/routes/cursos.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Obtener todos los cursos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cursos');
    res.json(rows);
  } catch (error) {
    console.error('Error getting cursos:', error);
    res.status(500).json({ error: 'Error getting cursos' });
  }
});

// Guardar cursos (reemplazar todos)
router.post('/', async (req, res) => {
  const cursos = req.body;
  
  try {
    // Usar una transacción para garantizar integridad
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Eliminar todos los cursos actuales
      await connection.query('DELETE FROM cursos');
      
      // Insertar los nuevos cursos
      if (Array.isArray(cursos) && cursos.length > 0) {
        const insertQuery = 'INSERT INTO cursos (id, nombre, fechaCreacion) VALUES ?';
        const values = cursos.map(curso => [curso.id, curso.nombre, curso.fechaCreacion]);
        await connection.query(insertQuery, [values]);
      }
      
      await connection.commit();
      res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error saving cursos:', error);
    res.status(500).json({ error: 'Error saving cursos' });
  }
});

module.exports = router;
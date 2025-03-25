// server/routes/grupos.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Obtener todos los grupos con su historial
router.get('/', async (req, res) => {
  try {
    // Obtener grupos
    const [grupos] = await pool.query('SELECT * FROM grupos');
    
    // Para cada grupo, obtener su historial
    for (const grupo of grupos) {
      const [historial] = await pool.query(
        'SELECT fecha, miembros, observaciones FROM historial_grupos WHERE grupoId = ? ORDER BY fecha',
        [grupo.id]
      );
      grupo.historial = historial;
    }
    
    res.json(grupos);
  } catch (error) {
    console.error('Error getting grupos:', error);
    res.status(500).json({ error: 'Error getting grupos' });
  }
});

// Guardar grupos (reemplazar todos)
router.post('/', async (req, res) => {
  const grupos = req.body;
  
  try {
    // Usar una transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Eliminar todos los grupos y su historial
      await connection.query('DELETE FROM historial_grupos');
      await connection.query('DELETE FROM grupos');
      
      // Insertar los nuevos grupos y su historial
      if (Array.isArray(grupos) && grupos.length > 0) {
        // Insertar grupos
        const insertGrupoQuery = 'INSERT INTO grupos (id, nombre, cursoId, curso, fechaCreacion, miembrosActuales) VALUES ?';
        const grupoValues = grupos.map(grupo => [
          grupo.id, grupo.nombre, grupo.cursoId, grupo.curso, grupo.fechaCreacion, grupo.miembrosActuales
        ]);
        await connection.query(insertGrupoQuery, [grupoValues]);
        
        // Insertar historial para cada grupo
        for (const grupo of grupos) {
          if (Array.isArray(grupo.historial) && grupo.historial.length > 0) {
            const insertHistorialQuery = 'INSERT INTO historial_grupos (grupoId, fecha, miembros, observaciones) VALUES ?';
            const historialValues = grupo.historial.map(h => [
              grupo.id, h.fecha, h.miembros, h.observaciones || ''
            ]);
            await connection.query(insertHistorialQuery, [historialValues]);
          }
        }
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
    console.error('Error saving grupos:', error);
    res.status(500).json({ error: 'Error saving grupos' });
  }
});

module.exports = router;
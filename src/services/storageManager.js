// src/services/storageManager.js
import { databaseService } from './databaseService';

// Config para determinar qué tipo de almacenamiento usar
// Puedes cambiar esto a true cuando quieras usar la base de datos
export const USE_DATABASE = false;

export const storageManager = {
  // Obtener datos
  getItem: async (key) => {
    if (USE_DATABASE) {
      try {
        // Obtener desde la base de datos
        const data = await databaseService.getData(key);
        console.log(`Datos recuperados para ${key} desde BD:`, data ? 'Datos encontrados' : 'Sin datos');
        return data;
      } catch (error) {
        console.error(`Error obteniendo datos de BD para ${key}:`, error);
        // Fallback a localStorage en caso de error
        console.log(`Intentando recuperar datos de localStorage para ${key} como fallback`);
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } else {
      try {
        // Obtener de localStorage
        const item = localStorage.getItem(key);
        console.log(`Datos recuperados para ${key} desde localStorage:`, item ? 'Datos encontrados' : 'Sin datos');
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error(`Error obteniendo datos de localStorage para ${key}:`, error);
        return null;
      }
    }
  },
  
  // Guardar datos
  setItem: async (key, value) => {
    if (USE_DATABASE) {
      try {
        // Guardar en la base de datos
        await databaseService.saveData(key, value);
        console.log(`Datos guardados para ${key} en BD`);
        return true;
      } catch (error) {
        console.error(`Error guardando datos en BD para ${key}:`, error);
        
        // Intentar guardar en localStorage como fallback
        try {
          localStorage.setItem(key, JSON.stringify(value));
          console.log(`Datos guardados para ${key} en localStorage como fallback`);
          return true;
        } catch (localError) {
          console.error(`También falló el guardado en localStorage:`, localError);
          return false;
        }
      }
    } else {
      try {
        // Guardar en localStorage
        localStorage.setItem(key, JSON.stringify(value));
        console.log(`Datos guardados para ${key} en localStorage`);
        return true;
      } catch (error) {
        console.error(`Error guardando datos en localStorage para ${key}:`, error);
        return false;
      }
    }
  }
};
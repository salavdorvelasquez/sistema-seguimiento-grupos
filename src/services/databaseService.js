// src/services/databaseService.js
const API_URL = 'http://localhost:3001/api'; // Ajusta según tu configuración

export const databaseService = {
  // Obtener datos
  getData: async (key) => {
    try {
      const response = await fetch(`${API_URL}/${key}`);
      if (!response.ok) throw new Error(`Error fetching ${key}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  },
  
  // Guardar datos
  saveData: async (key, value) => {
    try {
      const response = await fetch(`${API_URL}/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(value)
      });
      
      if (!response.ok) throw new Error(`Error saving ${key}`);
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }
};
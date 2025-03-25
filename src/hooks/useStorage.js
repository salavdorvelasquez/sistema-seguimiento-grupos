import { useState, useEffect } from 'react';
import { storageManager } from '../services/storageManager';

// Hook personalizado para manejar el almacenamiento (localStorage o base de datos)
function useStorage(key, initialValue) {
  // Estado para almacenar nuestro valor
  const [storedValue, setStoredValue] = useState(initialValue);
  // Estado para indicar si está cargando
  const [loading, setLoading] = useState(true);

  // Cargar datos al montar el componente
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Obtener datos del almacenamiento (localStorage o base de datos)
        const value = await storageManager.getItem(key);
        // Si hay un valor, actualizamos el estado
        if (value !== null) {
          setStoredValue(value);
        }
      } catch (error) {
        console.error(`Error cargando datos para ${key}:`, error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [key]);

  // Función para actualizar el almacenamiento y el estado
  const setValue = async (value) => {
    try {
      // Permitir que el valor sea una función para mantener la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en el estado
      setStoredValue(valueToStore);
      
      // Guardar en el almacenamiento con manejo de errores mejorado
      await storageManager.setItem(key, valueToStore)
        .catch(error => {
          console.error(`Error al guardar en storage para ${key}:`, error);
          // Alertar al usuario sobre el problema de persistencia
          alert('Hubo un problema al guardar los cambios. Por favor, intente nuevamente.');
          // Opcionalmente, podríamos revertir el estado aquí
        });
        
      console.log(`Datos actualizados para ${key}:`, valueToStore);
    } catch (error) {
      console.error(`Error general guardando datos para ${key}:`, error);
    }
  };

  // Escuchar cambios en localStorage (solo si estamos usando localStorage)
  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === key) {
        try {
          // Esta parte solo aplica si usamos localStorage
          if (!storageManager.USE_DATABASE) {
            const item = window.localStorage.getItem(key);
            if (item) {
              setStoredValue(JSON.parse(item));
              console.log(`Actualizando estado desde storage event para ${key}`);
            }
          }
        } catch (error) {
          console.error(`Error en storage event para ${key}:`, error);
        }
      }
    }

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Limpiar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  // Devolvemos estado, función para actualizar y estado de carga
  return [storedValue, setValue, loading];
}

export default useStorage;
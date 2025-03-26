// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || '';

export const fetchCursos = async () => {
  const response = await fetch(`${API_URL}/api/cursos`);
  if (!response.ok) throw new Error('Error al obtener cursos');
  return await response.json();
};

export const createCurso = async (nombre) => {
  const response = await fetch(`${API_URL}/api/cursos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre })
  });
  if (!response.ok) throw new Error('Error al crear curso');
  return await response.json();
};

export const fetchGrupos = async () => {
  const response = await fetch(`${API_URL}/api/grupos`);
  if (!response.ok) throw new Error('Error al obtener grupos');
  return await response.json();
};

export const createGrupo = async (data) => {
  const response = await fetch(`${API_URL}/api/grupos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Error al crear grupo');
  return await response.json();
};

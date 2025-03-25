// Datos iniciales para la aplicación
export const cursosIniciales = [
    { id: 'c1', nombre: 'Desarrollo Web', fechaCreacion: '2024-01-15' },
    { id: 'c2', nombre: 'Marketing Digital', fechaCreacion: '2024-02-10' },
    { id: 'c3', nombre: 'Diseño UX/UI', fechaCreacion: '2024-03-05' },
  ];
  
  export const gruposIniciales = [
    { 
      id: 'g1', 
      nombre: 'Grupo Alpha', 
      cursoId: 'c1', 
      curso: 'Desarrollo Web',
      fechaCreacion: '2024-01-20',
      miembrosActuales: 28,
      historial: [
        { fecha: '2024-01-20', miembros: 15, observaciones: 'Inicio del grupo' },
        { fecha: '2024-02-01', miembros: 18, observaciones: 'Campaña de invitación' },
        { fecha: '2024-03-01', miembros: 22, observaciones: '' },
        { fecha: '2024-04-01', miembros: 25, observaciones: '' },
        { fecha: '2024-05-01', miembros: 28, observaciones: 'Promoción especial' },
      ]
    },
    { 
      id: 'g2', 
      nombre: 'Grupo Beta', 
      cursoId: 'c1', 
      curso: 'Desarrollo Web',
      fechaCreacion: '2024-02-15',
      miembrosActuales: 22,
      historial: [
        { fecha: '2024-02-15', miembros: 10, observaciones: 'Inicio del grupo' },
        { fecha: '2024-03-01', miembros: 14, observaciones: '' },
        { fecha: '2024-04-01', miembros: 18, observaciones: 'Campaña en redes' },
        { fecha: '2024-05-01', miembros: 22, observaciones: '' },
      ]
    },
    { 
      id: 'g3', 
      nombre: 'Grupo Marketing Pro', 
      cursoId: 'c2', 
      curso: 'Marketing Digital',
      fechaCreacion: '2024-02-20',
      miembrosActuales: 35,
      historial: [
        { fecha: '2024-02-20', miembros: 20, observaciones: 'Inicio con promoción' },
        { fecha: '2024-03-01', miembros: 23, observaciones: '' },
        { fecha: '2024-04-01', miembros: 30, observaciones: 'Evento especial' },
        { fecha: '2024-05-01', miembros: 35, observaciones: '' },
      ]
    },
    { 
      id: 'g4', 
      nombre: 'Diseñadores UX', 
      cursoId: 'c3', 
      curso: 'Diseño UX/UI',
      fechaCreacion: '2024-03-10',
      miembrosActuales: 18,
      historial: [
        { fecha: '2024-03-10', miembros: 8, observaciones: 'Inicio del grupo' },
        { fecha: '2024-04-01', miembros: 12, observaciones: '' },
        { fecha: '2024-05-01', miembros: 18, observaciones: 'Workshop gratuito' },
      ]
    },
  ];
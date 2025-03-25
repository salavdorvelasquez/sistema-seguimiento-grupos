// Función para calcular crecimiento absoluto
export const calcularCrecimiento = (historial) => {
    if (!historial || historial.length < 2) return 0;
    const inicio = historial[0].miembros;
    const fin = historial[historial.length - 1].miembros;
    return fin - inicio;
  };
  
  // Función para calcular porcentaje de crecimiento
  export const calcularPorcentajeCrecimiento = (historial) => {
    if (!historial || historial.length < 2) return 0;
    const inicio = historial[0].miembros;
    const fin = historial[historial.length - 1].miembros;
    return Math.round(((fin - inicio) / inicio) * 100);
  };
  
  // Función para obtener grupos por curso
  export const getGruposPorCurso = (grupos, cursoId) => {
    return grupos.filter(g => g.cursoId === cursoId);
  };
  
  // Función para calcular total de miembros por curso
  export const getMiembrosPorCurso = (grupos, cursoId) => {
    return getGruposPorCurso(grupos, cursoId).reduce((sum, g) => sum + g.miembrosActuales, 0);
  };
  
  // Función para obtener grupo con mayor crecimiento
  export const getGrupoMasActivo = (grupos) => {
    if (!grupos || !grupos.length) return null;
    
    return grupos.reduce((masActivo, grupo) => {
      const crecimientoGrupo = calcularPorcentajeCrecimiento(grupo.historial);
      const crecimientoMasActivo = masActivo ? calcularPorcentajeCrecimiento(masActivo.historial) : 0;
      
      return crecimientoGrupo > crecimientoMasActivo ? grupo : masActivo;
    }, null);
  };
  
  // Función para calcular estadísticas generales
  export const calcularEstadisticas = (grupos) => {
    if (!grupos || !grupos.length) return { totalGrupos: 0, totalMiembros: 0, crecimientoTotal: 0 };
    
    const totalGrupos = grupos.length;
    const totalMiembros = grupos.reduce((sum, g) => sum + g.miembrosActuales, 0);
    const crecimientoTotal = grupos.reduce((sum, g) => sum + calcularCrecimiento(g.historial), 0);
    const grupoMasActivo = getGrupoMasActivo(grupos);
    
    return {
      totalGrupos,
      totalMiembros,
      crecimientoTotal,
      grupoMasActivo
    };
  };
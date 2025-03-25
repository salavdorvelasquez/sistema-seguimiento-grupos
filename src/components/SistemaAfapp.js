import React, { useState, useMemo } from 'react';
import { ChevronDown, Eye, Edit, Trash2, ArrowUp, ArrowDown, Calendar, Plus } from 'lucide-react';
import { CursoForm, GrupoForm, RegistroForm, DetalleGrupoModal } from './modals/ModalForms';
import useStorage from '../hooks/useStorage';
import { cursosIniciales, gruposIniciales } from '../data/initialData';
import { 
  calcularCrecimiento, 
  calcularPorcentajeCrecimiento, 
  getGruposPorCurso, 
  getMiembrosPorCurso,
  calcularEstadisticas,
  getGrupoMasActivo
} from '../utils/calculations';

const SistemaApp = () => {
  // Estado con persistencia en localStorage
  const [cursos, setCursos, loadingCursos] = useStorage('cursos', cursosIniciales);
  const [grupos, setGrupos, loadingGrupos] = useStorage('grupos', gruposIniciales);
  const isLoading = loadingCursos || loadingGrupos;
  
  // Función para obtener meses únicos de los cursos
  const obtenerMesesUnicos = (cursos) => {
    // Crear un conjunto para almacenar combinaciones únicas de año-mes
    const mesesUnicos = new Set();

    // Iterar sobre los cursos y extraer mes y año de la fecha de creación
    cursos.forEach(curso => {
      const fechaCreacion = new Date(curso.fechaCreacion);
      const añoMes = `${fechaCreacion.getFullYear()}-${String(fechaCreacion.getMonth() + 1).padStart(2, '0')}`;
      mesesUnicos.add(añoMes);
    });

    // Convertir el conjunto a un array y ordenarlo del más reciente al más antiguo
    return Array.from(mesesUnicos).sort().reverse();
  };

  // Estado local con filtro dinámico
  const [periodo, setPeriodo] = useState(() => {
    const mesesDisponibles = obtenerMesesUnicos(cursos);
    // Si hay meses disponibles, usar el más reciente, sino usar el mes actual
    return mesesDisponibles.length > 0 
      ? (() => {
          const [year, month] = mesesDisponibles[0].split('-');
          return { year: parseInt(year), month: parseInt(month) };
        })()
      : (() => {
          const fecha = new Date();
          return {
            year: fecha.getFullYear(),
            month: fecha.getMonth() + 1
          };
        })();
  });

  const [modalActivo, setModalActivo] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [cursoExpandido, setCursoExpandido] = useState(null);
  const [grupoParaRegistro, setGrupoParaRegistro] = useState(null);
  const [cursoParaEditar, setCursoParaEditar] = useState(null);
  const [grupoParaEditar, setGrupoParaEditar] = useState(null);

  // Función para formatear el período
  const formatearPeriodo = (periodo) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[periodo.month - 1]} de ${periodo.year}`;
  };

  // Función para cambiar el periodo
  const cambiarPeriodo = (e) => {
    const valor = e.target.value.split('-');
    setPeriodo({
      year: parseInt(valor[0], 10),
      month: parseInt(valor[1], 10)
    });
  };

 // Función para filtrar grupos por fecha de creación
const filtrarGruposPorFecha = (grupos) => {
  return grupos.filter(grupo => {
    const fechaCreacion = new Date(grupo.fechaCreacion);
    const añoCreacion = fechaCreacion.getFullYear();
    const mesCreacion = fechaCreacion.getMonth() + 1;
    
    // Comparar exactamente con el año y mes seleccionados
    return añoCreacion === periodo.year && mesCreacion === periodo.month;
  });
};

// Función para filtrar cursos por fecha de creación
const filtrarCursosPorFecha = (cursos) => {
  return cursos.filter(curso => {
    const fechaCreacion = new Date(curso.fechaCreacion);
    const añoCreacion = fechaCreacion.getFullYear();
    const mesCreacion = fechaCreacion.getMonth() + 1;
    
    // Comparar exactamente con el año y mes seleccionados
    return añoCreacion === periodo.year && mesCreacion === periodo.month;
  });
};

  // Aplicar filtros
  const cursosFiltrados = useMemo(() => filtrarCursosPorFecha(cursos), [cursos, periodo]);
  const gruposFiltrados = useMemo(() => filtrarGruposPorFecha(grupos), [grupos, periodo]);

  // Calcular estadísticas generales basadas en grupos filtrados
  const { totalGrupos, totalMiembros, crecimientoTotal } = calcularEstadisticas(gruposFiltrados);
  const grupoMasActivo = getGrupoMasActivo(gruposFiltrados);

  // Obtener meses únicos disponibles
  const mesesDisponibles = useMemo(() => obtenerMesesUnicos(cursos), [cursos]);

  // Handlers para cursos
  const handleAddCurso = (nuevoCurso) => {
    setCursos([...cursos, nuevoCurso]);
  };

  const handleUpdateCurso = (cursoActualizado) => {
    setCursos(cursos.map(c => c.id === cursoActualizado.id ? cursoActualizado : c));
    
    // Actualizar los nombres de cursos en los grupos
    if (cursoActualizado.nombre !== cursoParaEditar.nombre) {
      setGrupos(grupos.map(g => {
        if (g.cursoId === cursoActualizado.id) {
          return { ...g, curso: cursoActualizado.nombre };
        }
        return g;
      }));
    }
  };

  const handleDeleteCurso = (cursoId) => {
    if (window.confirm('¿Estás seguro de eliminar este curso? Esto eliminará también todos los grupos asociados.')) {
      setCursos(cursos.filter(c => c.id !== cursoId));
      // Eliminar grupos asociados
      setGrupos(grupos.filter(g => g.cursoId !== cursoId));
    }
  };

  // Handlers para grupos
  const handleAddGrupo = (nuevoGrupo) => {
    setGrupos([...grupos, nuevoGrupo]);
  };

  const handleUpdateGrupo = (grupoActualizado) => {
    setGrupos(grupos.map(g => g.id === grupoActualizado.id ? grupoActualizado : g));
  };

  const handleDeleteGrupo = (grupoId) => {
    if (window.confirm('¿Estás seguro de eliminar este grupo?')) {
      setGrupos(grupos.filter(g => g.id !== grupoId));
    }
  };

  // Handler para añadir nuevo registro a un grupo
  const handleAddRegistro = (grupoId, nuevoRegistro, miembrosActuales) => {
    setGrupos(grupos.map(g => {
      if (g.id === grupoId) {
        // Añadir el nuevo registro al historial
        const historialActualizado = [...g.historial, nuevoRegistro];
        
        // Ordenar el historial por fecha para mantener la cronología
        historialActualizado.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        
        return {
          ...g,
          miembrosActuales, // Actualizar el número actual de miembros
          historial: historialActualizado
        };
      }
      return g;
    }));
  };

  // Handler para editar un registro existente - VERSIÓN MEJORADA
  const handleEditarRegistro = (grupoId, registroEditado) => {
    console.log("Editando registro para grupo:", grupoId); 
    console.log("Registro editado:", registroEditado); 
    
    setGrupos(prevGrupos => { 
      return prevGrupos.map(grupo => { 
        if (grupo.id === grupoId) { 
          // Buscar el registro que coincide exactamente con la fecha 
          const nuevoHistorial = grupo.historial.map(registro => { 
            if (registro.fecha === registroEditado.fecha) { 
              return registroEditado; 
            } 
            return registro; 
          }); 
          
          // Ordenar el historial por fecha 
          nuevoHistorial.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); 
          
          // Actualizar el total de miembros si el registro editado es el último 
          const esUltimoRegistro = nuevoHistorial[nuevoHistorial.length - 1].fecha === registroEditado.fecha; 
          const miembrosActuales = esUltimoRegistro ? registroEditado.miembros : grupo.miembrosActuales; 
          
          console.log("Historial actualizado:", nuevoHistorial); 
          
          return { 
            ...grupo, 
            miembrosActuales, 
            historial: nuevoHistorial 
          }; 
        } 
        return grupo; 
      }); 
    });
  };

  // Alternar expansión de curso
  const toggleCursoExpansion = (cursoId) => {
    setCursoExpandido(cursoExpandido === cursoId ? null : cursoId);
  };

  // Abrir modal de detalle de grupo
  const abrirDetalleGrupo = (grupo) => {
    setGrupoSeleccionado(grupo);
    setModalActivo('detalleGrupo');
  };

  // Obtener fecha actual formateada
  const obtenerFechaActual = () => {
    const fecha = new Date();
    const mes = fecha.toLocaleString('es', { month: 'long' });
    const año = fecha.getFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${año}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sistema de Seguimiento de Grupos</h1>
          <div className="flex space-x-2">
            {/* Selector de período dinámico */}
            <select 
              className="bg-white text-blue-600 px-3 py-2 rounded-md font-medium"
              onChange={cambiarPeriodo}
              value={`${periodo.year}-${periodo.month.toString().padStart(2, '0')}`}
            >
              {mesesDisponibles.map(mesAño => {
                const [year, month] = mesAño.split('-');
                const meses = [
                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ];
                return (
                  <option key={mesAño} value={mesAño}>
                    {meses[parseInt(month) - 1]} de {year}
                  </option>
                );
              })}
            </select>
            <button 
              className="bg-blue-500 hover:bg-blue-700 px-3 py-2 rounded-md flex items-center font-medium border border-white"
              onClick={() => {
                if (grupos.length > 0) {
                  setGrupoParaRegistro(grupos[0]);
                  setModalActivo('nuevoRegistro');
                } else {
                  alert('No hay grupos disponibles. Crea un grupo primero.');
                }
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Registro
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto p-4 flex-grow">
        {/* Botones de acción principales */}
        <div className="flex justify-end space-x-3 mb-4">
          <button 
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-md flex items-center"
            onClick={() => setModalActivo('nuevoCurso')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Curso
          </button>
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md flex items-center"
            onClick={() => {
              if (cursos.length > 0) {
                setModalActivo('nuevoGrupo');
              } else {
                alert('No hay cursos disponibles. Crea un curso primero.');
              }
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Grupo
          </button>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md flex items-center"
            onClick={() => {
              if (grupos.length > 0) {
                setGrupoParaRegistro(grupos[0]);
                setModalActivo('nuevoRegistro');
              } else {
                alert('No hay grupos disponibles. Crea un grupo primero.');
              }
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Añadir Registro
          </button>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm">Total de Grupos</h2>
            <p className="text-3xl font-bold">{totalGrupos}</p>
            <p className="text-green-500 flex items-center mt-2">
              <ArrowUp className="w-4 h-4 mr-1" />
              +2 este mes
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm">Total de Miembros</h2>
            <p className="text-3xl font-bold">{totalMiembros}</p>
            <p className="text-green-500 flex items-center mt-2">
              <ArrowUp className="w-4 h-4 mr-1" />
              +18 este mes
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm">Crecimiento Total</h2>
            <p className="text-3xl font-bold">+{crecimientoTotal}</p>
            <p className="text-green-500 flex items-center mt-2">
              <ArrowUp className="w-4 h-4 mr-1" />
              21% desde inicio
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm">Grupo más activo</h2>
            <p className="text-xl font-bold">{grupoMasActivo?.nombre || 'No hay datos'}</p>
            {grupoMasActivo && (
              <p className="text-green-500 flex items-center mt-2">
                <ArrowUp className="w-4 h-4 mr-1" />
                +{calcularCrecimiento(grupoMasActivo.historial)} ({calcularPorcentajeCrecimiento(grupoMasActivo.historial)}% crecimiento)
              </p>
            )}
          </div>
        </div>

        {/* Cursos Activos */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Cursos Activos</h2>
            <button 
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-md flex items-center"
              onClick={() => setModalActivo('nuevoCurso')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Curso
            </button>
          </div>
          <div>
            {cursosFiltrados.map(curso => {
              const gruposCurso = getGruposPorCurso(gruposFiltrados, curso.id);
              const totalMiembrosCurso = getMiembrosPorCurso(gruposFiltrados, curso.id);
              
              return (
                <div key={curso.id} className="border-b last:border-b-0">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleCursoExpansion(curso.id)}
                  >
                    <div className="flex items-center">
                      <ChevronDown className={`w-5 h-5 mr-2 transform ${cursoExpandido === curso.id ? 'rotate-180' : ''} transition-transform`} />
                      <span className="font-medium">{curso.nombre}</span>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div>
                        <span className="text-gray-500 mr-1">{gruposCurso.length} {gruposCurso.length === 1 ? 'grupo' : 'grupos'}</span>
                        <span className="mx-2">|</span>
                        <span className="text-gray-500">{totalMiembrosCurso} miembros totales</span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCursoParaEditar(curso);
                            setModalActivo('editarCurso');
                          }}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCurso(curso.id);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {cursoExpandido === curso.id && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Grupos en este curso</h3>
                        <button 
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-sm flex items-center"
                          onClick={() => setModalActivo('nuevoGrupo')}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Nuevo Grupo
                        </button>
                      </div>
                      {gruposCurso.length > 0 ? (
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miembros</th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crecimiento</th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Crecimiento</th>
                              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                              <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {gruposCurso.map(grupo => {
                              const crecimiento = calcularCrecimiento(grupo.historial);
                              const porcentaje = calcularPorcentajeCrecimiento(grupo.historial);
                              return (
                                <tr key={grupo.id} className="hover:bg-gray-50">
                                  <td className="py-3 px-4">{grupo.nombre}</td>
                                  <td className="py-3 px-4">{grupo.miembrosActuales}</td>
                                  <td className="py-3 px-4">
                                    <span className={`${crecimiento >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                                      {crecimiento >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                                      {Math.abs(crecimiento)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`${porcentaje >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                      {porcentaje >= 0 ? '+' : ''}{porcentaje}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">{grupo.fechaCreacion}</td>
                                  <td className="py-3 px-4 text-right">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        abrirDetalleGrupo(grupo);
                                      }} 
                                      className="text-blue-600 hover:text-blue-900 mr-2"
                                    >
                                      <Eye className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setGrupoParaEditar(grupo);
                                        setModalActivo('editarGrupo');
                                      }}
                                      className="text-gray-600 hover:text-gray-900 mr-2"
                                    >
                                      <Edit className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteGrupo(grupo.id);
                                      }}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-4 bg-white rounded-lg shadow">
                          <p className="text-gray-500">No hay grupos en este curso</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {cursosFiltrados.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No hay cursos activos para el período seleccionado</p>
                <button 
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
                  onClick={() => setModalActivo('nuevoCurso')}
                >
                  Crear primer curso
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Grupos Activos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Grupos Activos</h2>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md flex items-center"
              onClick={() => {
                if (cursos.length > 0) {
                  setModalActivo('nuevoGrupo');
                } else {
                  alert('No hay cursos disponibles. Crea un curso primero.');
                }
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Grupo
            </button>
          </div>
          <div className="overflow-x-auto">
            {gruposFiltrados.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miembros</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crecimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Crecimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gruposFiltrados.map(grupo => {
                    const crecimiento = calcularCrecimiento(grupo.historial);
                    const porcentaje = calcularPorcentajeCrecimiento(grupo.historial);
                    return (
                      <tr key={grupo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{grupo.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{grupo.curso}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{grupo.miembrosActuales}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`${crecimiento >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                            {crecimiento >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                            {Math.abs(crecimiento)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`${porcentaje >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {porcentaje >= 0 ? '+' : ''}{porcentaje}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{grupo.fechaCreacion}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => abrirDetalleGrupo(grupo)} 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => {
                              setGrupoParaEditar(grupo);
                              setModalActivo('editarGrupo');
                            }}
                            className="text-gray-600 hover:text-gray-900 mr-3"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteGrupo(grupo.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No hay grupos activos para el período seleccionado</p>
                {cursos.length > 0 ? (
                  <button 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                    onClick={() => setModalActivo('nuevoGrupo')}
                  >
                    Crear primer grupo
                  </button>
                ) : (
                  <button 
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
                    onClick={() => setModalActivo('nuevoCurso')}
                  >
                    Primero debes crear un curso
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modales */}
      {modalActivo === 'nuevoCurso' && (
        <CursoForm 
          onSubmit={handleAddCurso} 
          onClose={() => setModalActivo(null)} 
        />
      )}

      {modalActivo === 'editarCurso' && cursoParaEditar && (
        <CursoForm 
          curso={cursoParaEditar} 
          onSubmit={handleUpdateCurso} 
          onClose={() => {
            setModalActivo(null);
            setCursoParaEditar(null);
          }} 
        />
      )}
      
      {modalActivo === 'nuevoGrupo' && (
        <GrupoForm 
          cursos={cursos} 
          onSubmit={handleAddGrupo} 
          onClose={() => setModalActivo(null)} 
        />
      )}
      
      {modalActivo === 'editarGrupo' && grupoParaEditar && (
        <GrupoForm 
          grupo={grupoParaEditar} 
          cursos={cursos} 
          onSubmit={handleUpdateGrupo} 
          onClose={() => {
            setModalActivo(null);
            setGrupoParaEditar(null);
          }} 
        />
      )}
      
      {modalActivo === 'nuevoRegistro' && grupoParaRegistro && (
        <RegistroForm 
          grupo={grupoParaRegistro} 
          onSubmit={handleAddRegistro} 
          onClose={() => {
            setModalActivo(null);
            setGrupoParaRegistro(null);
          }} 
        />
      )}
      
      {modalActivo === 'detalleGrupo' && grupoSeleccionado && (
        <DetalleGrupoModal 
          grupo={grupoSeleccionado} 
          onClose={() => {
            setModalActivo(null);
            setGrupoSeleccionado(null);
          }}
          onNuevoRegistro={(grupo) => {
            setGrupoParaRegistro(grupo);
            setGrupoSeleccionado(null);
            setModalActivo('nuevoRegistro');
          }}
          onEditarRegistro={handleEditarRegistro}
        />
      )}
    </div>
  );
};

export default SistemaApp;
import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Componente para modal base
export const Modal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
        <div className="bg-gray-50 p-4 flex justify-end space-x-2 border-t">
          <button 
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Cancelar
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
};

// Modal para crear/editar curso
export const CursoForm = ({ curso = null, onSubmit, onClose }) => {
  const [nombre, setNombre] = useState(curso ? curso.nombre : '');
  const [fechaCreacion, setFechaCreacion] = useState(
    curso ? curso.fechaCreacion : new Date().toISOString().split('T')[0]
  );
  const isEditing = !!curso;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit({
      id: curso ? curso.id : `c${Date.now()}`,
      nombre,
      fechaCreacion
    });
    
    onClose();
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={isEditing ? 'Editar Curso' : 'Nuevo Curso'}
      actions={
        <button 
          onClick={handleSubmit}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          disabled={!nombre.trim()}
        >
          {isEditing ? 'Actualizar' : 'Crear'} Curso
        </button>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
            Nombre del Curso
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Ingrese nombre del curso"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fechaCreacion">
            Fecha de Creación
          </label>
          <input
            id="fechaCreacion"
            type="date"
            value={fechaCreacion}
            onChange={(e) => setFechaCreacion(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

// Modal para crear/editar grupo
export const GrupoForm = ({ grupo = null, cursos, onSubmit, onClose }) => {
  const [nombre, setNombre] = useState(grupo ? grupo.nombre : '');
  const [cursoId, setCursoId] = useState(grupo ? grupo.cursoId : cursos[0]?.id || '');
  const [miembros, setMiembros] = useState(grupo ? grupo.miembrosActuales : '');
  const [fechaCreacion, setFechaCreacion] = useState(
    grupo ? grupo.fechaCreacion : new Date().toISOString().split('T')[0]
  );
  const isEditing = !!grupo;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Encontrar el nombre del curso
    const cursoSeleccionado = cursos.find(c => c.id === cursoId);
    const miembrosNum = parseInt(miembros, 10);
    
    const nuevoGrupo = {
      id: grupo ? grupo.id : `g${Date.now()}`,
      nombre,
      cursoId,
      curso: cursoSeleccionado?.nombre || '',
      fechaCreacion,
      miembrosActuales: miembrosNum,
      historial: grupo ? [...grupo.historial] : [{
        fecha: fechaCreacion,
        miembros: miembrosNum,
        observaciones: 'Inicio del grupo'
      }]
    };
    
    // Si es edición, actualizamos el último registro si ha cambiado el número de miembros
    if (isEditing && grupo.miembrosActuales !== miembrosNum) {
      const fechaActual = new Date().toISOString().split('T')[0];
      nuevoGrupo.historial.push({
        fecha: fechaActual,
        miembros: miembrosNum,
        observaciones: 'Actualización de miembros'
      });
    }
    
    onSubmit(nuevoGrupo);
    onClose();
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={isEditing ? 'Editar Grupo' : 'Nuevo Grupo'}
      actions={
        <button 
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          disabled={!nombre.trim() || !cursoId || !miembros}
        >
          {isEditing ? 'Actualizar' : 'Crear'} Grupo
        </button>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">
            Nombre del Grupo
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Ingrese nombre del grupo"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="curso">
            Curso
          </label>
          <select
            id="curso"
            value={cursoId}
            onChange={(e) => setCursoId(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Seleccione un curso</option>
            {cursos.map(curso => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fechaCreacion">
            Fecha de Creación
          </label>
          <input
            id="fechaCreacion"
            type="date"
            value={fechaCreacion}
            onChange={(e) => setFechaCreacion(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="miembros">
            Número de Miembros Inicial
          </label>
          <input
            id="miembros"
            type="number"
            min="1"
            value={miembros}
            onChange={(e) => setMiembros(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Ingrese número de miembros"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

// Modal para añadir registro
export const RegistroForm = ({ grupo, onSubmit, onClose }) => {
  // Cambio clave: ahora manejamos incremento, no el total
  const [incremento, setIncremento] = useState(0);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');

  // El último registro para referencia
  const ultimoRegistro = grupo.historial[grupo.historial.length - 1];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convertir el incremento a número
    const incrementoNum = parseInt(incremento, 10);
    
    // Validar fecha
    const fechaUltimoRegistro = new Date(ultimoRegistro.fecha);
    const fechaNuevoRegistro = new Date(fecha);
    
    if (fechaNuevoRegistro < fechaUltimoRegistro) {
      alert('La fecha del nuevo registro debe ser posterior o igual al último registro existente.');
      return;
    }
    
    // Calcular el nuevo total sumando el incremento al total anterior
    const nuevoTotal = ultimoRegistro.miembros + incrementoNum;
    
    // Crear el objeto de nuevo registro
    const nuevoRegistro = {
      fecha,
      miembros: nuevoTotal, // Guardamos el nuevo total
      observaciones
    };
    
    // Enviar el nuevo registro para ser procesado
    onSubmit(grupo.id, nuevoRegistro, nuevoTotal);
    onClose();
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={`Nuevo Registro - ${grupo.nombre}`}
      actions={
        <button 
          onClick={handleSubmit}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Añadir Registro
        </button>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fecha">
            Fecha del Registro
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="incremento">
            Nuevos Miembros a Agregar
          </label>
          <input
            id="incremento"
            type="number"
            min="0"
            value={incremento}
            onChange={(e) => setIncremento(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
          <p className="text-sm mt-1 text-gray-500">
            Se agregarán {incremento || 0} miembros al total actual ({ultimoRegistro.miembros})
          </p>
          <p className="text-sm mt-1 font-medium">
            Nuevo total: {ultimoRegistro.miembros + (parseInt(incremento) || 0)} miembros
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observaciones">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Ingrese observaciones (opcional)"
            rows="3"
          ></textarea>
        </div>
      </form>
    </Modal>
  );
};

// Modal para editar un registro existente
export const EditarRegistroModal = ({ registro, onSubmit, onClose }) => {
  const [miembros, setMiembros] = useState(registro.miembros);
  const [fecha, setFecha] = useState(registro.fecha);
  const [observaciones, setObservaciones] = useState(registro.observaciones || '');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Crear una copia completa del registro para evitar problemas de referencia
    const registroActualizado = {
      ...registro,
      fecha,
      miembros: parseInt(miembros, 10),
      observaciones
    };
    
    console.log("EditarRegistroModal - Enviando registro actualizado:", registroActualizado);
    
    // Llamamos a la función que se encargará de actualizar el estado global
    onSubmit(registroActualizado);
    onClose();
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title="Editar Registro"
      actions={
        <button 
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          disabled={!miembros}
        >
          Guardar Cambios
        </button>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fecha">
            Fecha del Registro
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="miembros">
            Número Total de Miembros
          </label>
          <input
            id="miembros"
            type="number"
            min="1"
            value={miembros}
            onChange={(e) => setMiembros(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observaciones">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Ingrese observaciones (opcional)"
            rows="3"
          ></textarea>
        </div>
      </form>
    </Modal>
  );
};

// Modal para ver detalles de grupo - VERSIÓN CORREGIDA con actualización inmediata
export const DetalleGrupoModal = ({ grupo, onClose, onNuevoRegistro, onEditarRegistro }) => {
  // Estado para el registro que se está editando
  const [registroParaEditar, setRegistroParaEditar] = useState(null);
  
  // Estado local para mantener una copia actualizada del grupo
  const [grupoActualizado, setGrupoActualizado] = useState(grupo);
  
  // Actualizar el estado local cuando cambia el grupo desde props
  useEffect(() => {
    setGrupoActualizado(grupo);
  }, [grupo]);
  
  // Salimos temprano si no hay grupo
  if (!grupoActualizado) return null;

  // Cálculo de crecimiento para cada registro
  const registrosConCambio = grupoActualizado.historial.map((registro, index) => {
    const cambio = index > 0 
      ? registro.miembros - grupoActualizado.historial[index-1].miembros 
      : 0;
    return { ...registro, cambio };
  });

  // Función para manejar la edición y actualizar la interfaz inmediatamente
  const handleEditarYActualizar = (registroEditado) => {
    console.log("DetalleGrupoModal - Enviando registro a handleEditarRegistro:", registroEditado);
    
    // Llamar a la función principal que actualiza el estado global
    onEditarRegistro(grupoActualizado.id, registroEditado);
    
    // Actualizar también el estado local para reflejar los cambios inmediatamente
    const nuevoHistorial = grupoActualizado.historial.map(registro => 
      registro.fecha === registroEditado.fecha ? registroEditado : registro
    );
    
    // Ordenar el historial por fecha
    nuevoHistorial.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Comprobar si es el último registro para actualizar miembrosActuales
    const esUltimoRegistro = nuevoHistorial[nuevoHistorial.length - 1].fecha === registroEditado.fecha;
    const miembrosActuales = esUltimoRegistro ? registroEditado.miembros : grupoActualizado.miembrosActuales;
    
    // Actualizar el estado local con los cambios
    setGrupoActualizado({
      ...grupoActualizado,
      miembrosActuales,
      historial: nuevoHistorial
    });
    
    // Cerrar el modal de edición
    setRegistroParaEditar(null);
  };

  return (
    <>
      <Modal 
        isOpen={true} 
        onClose={onClose} 
        title={grupoActualizado.nombre}
        actions={
          <button 
            onClick={() => onNuevoRegistro(grupoActualizado)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Nuevo Registro
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-500 text-sm">Curso</p>
            <p className="font-medium">{grupoActualizado.curso}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-500 text-sm">Fecha de creación</p>
            <p className="font-medium">{grupoActualizado.fechaCreacion}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-500 text-sm">Miembros actuales</p>
            <p className="font-medium">{grupoActualizado.miembrosActuales}</p>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-4">Evolución del grupo</h3>
        <div className="h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={grupoActualizado.historial.map(h => ({
                fecha: h.fecha.substring(5), // Solo mes y día
                miembros: h.miembros
              }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: 14 }}
                tickMargin={10}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 14 }}
              />
              <Tooltip 
                contentStyle={{ fontSize: '14px' }}
                formatter={(value) => [`${value} miembros`, 'Total']}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} /> 
              <Line 
                type="monotone" 
                dataKey="miembros" 
                stroke="#3B82F6" 
                strokeWidth={3}
                activeDot={{ r: 8 }}
                name="Miembros"
                dot={{ r: 4, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Historial de registros</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miembros</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cambio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrosConCambio.map((registro, index) => (
                <tr key={registro.fecha}>
                  <td className="px-6 py-4 whitespace-nowrap">{registro.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{registro.miembros}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {index === 0 ? (
                      <span className="text-blue-500">Inicial</span>
                    ) : (
                      <span className={registro.cambio >= 0 ? "text-green-500" : "text-red-500"}>
                        {registro.cambio > 0 ? '+' : ''}{registro.cambio}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {registro.observaciones || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => setRegistroParaEditar({...registro})}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Modal para editar registro */}
      {registroParaEditar && (
        <EditarRegistroModal 
          registro={registroParaEditar}
          onSubmit={(registroEditado) => {
            // Usar la función que actualiza tanto el estado global como la interfaz local
            handleEditarYActualizar(registroEditado);
          }}
          onClose={() => setRegistroParaEditar(null)}
        />
      )}
    </>
  );
};
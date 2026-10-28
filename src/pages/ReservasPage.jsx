import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReservas, crearReserva, actualizarEstadoReserva, eliminarReserva } from '../services/reservasService';
import { getMesas } from '../services/mesasService';
import { formatDate } from '../utils/formatters';
import AlertMessage from '../components/AlertMessage';

export default function ReservasPage() {
  const { activeLocalId, activeLocal, locales, isAdmin, switchActiveLocal } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  // Formulario nueva reserva
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '21:00',
    mesa_id: '',
    personas: 4
  });

  const cargarDatos = () => {
    setReservas(getReservas(activeLocalId));
    setMesas(getMesas(activeLocalId));
  };

  useEffect(() => {
    cargarDatos();
  }, [activeLocalId]);

  const abrirNuevo = () => {
    setFormData({
      cliente_nombre: '',
      cliente_telefono: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: '21:00',
      mesa_id: mesas[0]?.id || '',
      personas: 4
    });
    setMostrarForm(true);
  };

  const handleCrear = (e) => {
    e.preventDefault();
    if (!formData.cliente_nombre.trim() || !formData.cliente_telefono.trim()) {
      setMensaje({ type: 'danger', text: 'Nombre y teléfono del cliente son obligatorios.' });
      return;
    }

    try {
      crearReserva({
        ...formData,
        local_id: activeLocalId,
        estado: 'confirmada'
      });
      setMensaje({ type: 'success', text: `Reserva confirmada para ${formData.cliente_nombre}.` });
      setMostrarForm(false);
      cargarDatos();
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message || 'Error al guardar reserva.' });
    }
  };

  const handleCambiarEstado = (id, nuevoEstado) => {
    try {
      actualizarEstadoReserva(id, nuevoEstado);
      setMensaje({ type: 'success', text: `Reserva marcada como: ${nuevoEstado}.` });
      cargarDatos();
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message || 'Error al actualizar reserva.' });
    }
  };

  const handleEliminar = (id) => {
    if (window.confirm('¿Desea eliminar este registro de reserva?')) {
      eliminarReserva(id);
      setMensaje({ type: 'info', text: 'Reserva eliminada.' });
      cargarDatos();
    }
  };

  return (
    <div className="app-container">
      <div className="page-title">
        <div>
          Libro de Reservas — <strong>{activeLocal?.nombre}</strong>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdmin && (
            <select
              value={activeLocalId}
              onChange={(e) => switchActiveLocal(e.target.value)}
              style={{ width: 'auto' }}
            >
              {locales.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre}</option>
              ))}
            </select>
          )}

          <button onClick={abrirNuevo} className="btn btn-primary">
            + Nueva Reserva
          </button>
        </div>
      </div>

      <AlertMessage
        type={mensaje?.type}
        message={mensaje?.text}
        onClose={() => setMensaje(null)}
      />

      {mostrarForm && (
        <div className="card" style={{ marginBottom: '16px', backgroundColor: '#fcfcfc' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Registrar Nueva Reserva</h3>
          <form onSubmit={handleCrear}>
            <div className="grid-3">
              <div className="form-group">
                <label>Nombre y Apellido del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo Delgado"
                  value={formData.cliente_nombre}
                  onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Teléfono de Contacto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 351-4567890"
                  value={formData.cliente_telefono}
                  onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Cantidad de Personas</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={formData.personas}
                  onChange={(e) => setFormData({ ...formData, personas: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label>Fecha</label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Hora</label>
                <input
                  type="time"
                  required
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Asignar Mesa en {activeLocal?.nombre}</label>
                <select
                  value={formData.mesa_id}
                  onChange={(e) => setFormData({ ...formData, mesa_id: e.target.value })}
                  required
                >
                  {mesas.map((m) => (
                    <option key={m.id} value={m.id}>
                      Mesa #{m.numero} (Capacidad: {m.capacidad} personas — {m.estado})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" onClick={() => setMostrarForm(false)} className="btn">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Confirmar Reserva
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Reservas */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Mesa</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th className="text-center">Personas</th>
              <th className="text-center">Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center" style={{ color: '#888', padding: '20px' }}>
                  No hay reservas agendadas en este local.
                </td>
              </tr>
            ) : (
              reservas.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{formatDate(r.fecha, false)}</strong> a las <strong>{r.hora} hs</strong>
                  </td>
                  <td>Mesa #{r.numero_mesa}</td>
                  <td><strong>{r.cliente_nombre}</strong></td>
                  <td>{r.cliente_telefono}</td>
                  <td className="text-center">{r.personas} pers.</td>
                  <td className="text-center">
                    <span
                      className={`badge ${
                        r.estado === 'confirmada'
                          ? 'badge-reservada'
                          : r.estado === 'completada'
                          ? 'badge-ok-stock'
                          : 'badge-low-stock'
                      }`}
                    >
                      {r.estado}
                    </span>
                  </td>
                  <td className="text-center">
                    {r.estado === 'confirmada' && (
                      <>
                        <button
                          onClick={() => handleCambiarEstado(r.id, 'completada')}
                          className="btn btn-sm"
                          style={{ marginRight: '6px' }}
                          title="Marcar como recibida y completada"
                        >
                          Llegó
                        </button>
                        <button
                          onClick={() => handleCambiarEstado(r.id, 'cancelada')}
                          className="btn btn-sm btn-danger-outline"
                          style={{ marginRight: '6px' }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEliminar(r.id)}
                      className="btn btn-sm"
                      title="Eliminar registro"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Servicio de reservas y asignación de mesas
 */

import { getDb, saveDb, generateId } from './db';

export function getReservas(localId = null) {
  const db = getDb();
  const reservas = db.reservas || [];
  const mesas = db.mesas || [];

  return reservas
    .filter((r) => (localId ? r.local_id === localId : true))
    .map((r) => {
      const mesa = mesas.find((m) => m.id === r.mesa_id);
      return {
        ...r,
        numero_mesa: mesa ? mesa.numero : 'S/M'
      };
    })
    .sort((a, b) => new Date(`${b.fecha}T${b.hora || '00:00'}`) - new Date(`${a.fecha}T${a.hora || '00:00'}`));
}

export function crearReserva(reservaData) {
  const db = getDb();
  const newResId = generateId('res');

  const nuevaReserva = {
    id: newResId,
    local_id: reservaData.local_id,
    mesa_id: reservaData.mesa_id,
    cliente_nombre: reservaData.cliente_nombre.trim(),
    cliente_telefono: reservaData.cliente_telefono.trim(),
    fecha: reservaData.fecha,
    hora: reservaData.hora,
    personas: Number(reservaData.personas) || 2,
    estado: reservaData.estado || 'confirmada'
  };

  db.reservas = db.reservas || [];
  db.reservas.push(nuevaReserva);

  // Si la reserva es confirmada, actualizar estado de la mesa
  if (nuevaReserva.estado === 'confirmada' && nuevaReserva.mesa_id) {
    const mesa = (db.mesas || []).find((m) => m.id === nuevaReserva.mesa_id);
    if (mesa && mesa.estado === 'libre') {
      mesa.estado = 'reservada';
    }
  }

  saveDb(db);
  return nuevaReserva;
}

export function actualizarEstadoReserva(id, nuevoEstado) {
  const db = getDb();
  const res = (db.reservas || []).find((r) => r.id === id);
  if (!res) throw new Error('Reserva no encontrada');

  res.estado = nuevoEstado;

  const mesa = (db.mesas || []).find((m) => m.id === res.mesa_id);
  if (mesa) {
    if (nuevoEstado === 'cancelada' || nuevoEstado === 'completada') {
      // Si la mesa estaba reservada, liberarla
      if (mesa.estado === 'reservada') {
        mesa.estado = 'libre';
      }
    } else if (nuevoEstado === 'confirmada' && mesa.estado === 'libre') {
      mesa.estado = 'reservada';
    }
  }

  saveDb(db);
  return res;
}

export function eliminarReserva(id) {
  const db = getDb();
  const res = (db.reservas || []).find((r) => r.id === id);
  if (res && res.mesa_id) {
    const mesa = (db.mesas || []).find((m) => m.id === res.mesa_id);
    if (mesa && mesa.estado === 'reservada') {
      mesa.estado = 'libre';
    }
  }
  db.reservas = (db.reservas || []).filter((r) => r.id !== id);
  saveDb(db);
  return true;
}

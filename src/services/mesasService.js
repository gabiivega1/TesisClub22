/**
 * Servicio de gestión de mesas y cuentas abiertas
 */

import { getDb, saveDb, generateId } from './db';

export function getMesas(localId) {
  const db = getDb();
  const mesas = (db.mesas || []).filter((m) => m.local_id === localId);
  const pedidosAbiertos = (db.pedidos || []).filter(
    (p) => p.local_id === localId && p.estado === 'abierto' && p.tipo === 'mesa'
  );
  const items = db.pedido_items || [];

  return mesas.map((m) => {
    const pedido = pedidosAbiertos.find((p) => p.mesa_id === m.id);
    let totalAcumulado = 0;
    let cantidadItems = 0;

    if (pedido) {
      const pedidoItems = items.filter((it) => it.pedido_id === pedido.id);
      totalAcumulado = pedidoItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
      cantidadItems = pedidoItems.reduce((acc, it) => acc + (it.cantidad || 0), 0);
    }

    return {
      ...m,
      pedido_id: pedido ? pedido.id : null,
      total_acumulado: totalAcumulado,
      cantidad_items: cantidadItems
    };
  });
}

export function abrirMesa(mesaId, usuarioId = 'usr_admin') {
  const db = getDb();
  const mesa = (db.mesas || []).find((m) => m.id === mesaId);
  if (!mesa) throw new Error('Mesa no encontrada');

  mesa.estado = 'ocupada';

  // Verificar si ya existe un pedido abierto para esta mesa
  let pedidoAbierto = (db.pedidos || []).find(
    (p) => p.mesa_id === mesaId && p.estado === 'abierto'
  );

  if (!pedidoAbierto) {
    pedidoAbierto = {
      id: generateId('ped'),
      local_id: mesa.local_id,
      tipo: 'mesa',
      mesa_id: mesa.id,
      numero_mesa: mesa.numero,
      fecha: new Date().toISOString(),
      estado: 'abierto',
      subtotal: 0,
      descuento: 0,
      total: 0,
      promocion_id: null,
      usuario_id: usuarioId,
      notas: `Mesa ${mesa.numero} abierta`
    };
    db.pedidos = db.pedidos || [];
    db.pedidos.push(pedidoAbierto);
  }

  saveDb(db);
  return { mesa, pedido: pedidoAbierto };
}

export function getCuentaMesa(mesaId) {
  const db = getDb();
  const mesa = (db.mesas || []).find((m) => m.id === mesaId);
  if (!mesa) return null;

  const pedido = (db.pedidos || []).find(
    (p) => p.mesa_id === mesaId && p.estado === 'abierto'
  );

  if (!pedido) return { mesa, pedido: null, items: [] };

  const items = (db.pedido_items || []).filter((it) => it.pedido_id === pedido.id);

  return {
    mesa,
    pedido,
    items
  };
}

export function agregarItemsACuenta(mesaId, itemsParaAgregar, usuarioId = 'usr_admin') {
  const db = getDb();
  let cuenta = getCuentaMesa(mesaId);

  if (!cuenta.pedido) {
    const res = abrirMesa(mesaId, usuarioId);
    cuenta = { mesa: res.mesa, pedido: res.pedido, items: [] };
  }

  const pedidoIndex = db.pedidos.findIndex((p) => p.id === cuenta.pedido.id);
  db.pedido_items = db.pedido_items || [];

  itemsParaAgregar.forEach((it) => {
    const nuevoItem = {
      id: generateId('it'),
      pedido_id: cuenta.pedido.id,
      producto_id: it.producto_id || null,
      combo_id: it.combo_id || null,
      es_combo: Boolean(it.es_combo),
      nombre_item: it.nombre,
      cantidad: Number(it.cantidad) || 1,
      precio_unitario: Number(it.precio_unitario) || 0,
      subtotal: (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0),
      notas: it.notas ? it.notas.trim() : '',
      estado_cocina: it.es_comida ? 'pendiente' : 'no_aplica'
    };
    db.pedido_items.push(nuevoItem);
  });

  // Recalcular subtotal y total de la cuenta
  const todosLosItems = db.pedido_items.filter((it) => it.pedido_id === cuenta.pedido.id);
  const nuevoSubtotal = todosLosItems.reduce((acc, it) => acc + it.subtotal, 0);

  db.pedidos[pedidoIndex].subtotal = nuevoSubtotal;
  db.pedidos[pedidoIndex].total = nuevoSubtotal - (db.pedidos[pedidoIndex].descuento || 0);

  saveDb(db);
  return {
    pedido: db.pedidos[pedidoIndex],
    items: todosLosItems
  };
}

export function liberarMesa(mesaId) {
  const db = getDb();
  const mesa = (db.mesas || []).find((m) => m.id === mesaId);
  if (mesa) {
    mesa.estado = 'libre';
    saveDb(db);
  }
}

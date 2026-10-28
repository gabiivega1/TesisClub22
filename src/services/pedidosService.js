/**
 * Servicio de pedidos, punto de venta (POS), cobro mixto, stock y cocina
 */

import { getDb, saveDb, generateId } from './db';

export function getPedidos(localId = null, limit = 50) {
  const db = getDb();
  const pedidos = db.pedidos || [];
  const locales = db.locales || [];
  const items = db.pedido_items || [];
  const pagos = db.pagos || [];

  return pedidos
    .filter((p) => (localId ? p.local_id === localId : true))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, limit)
    .map((p) => {
      const loc = locales.find((l) => l.id === p.local_id);
      const pedItems = items.filter((it) => it.pedido_id === p.id);
      const pedPagos = pagos.filter((pg) => pg.pedido_id === p.id);
      return {
        ...p,
        local_nombre: loc ? loc.nombre : 'Local',
        items: pedItems,
        pagos: pedPagos
      };
    });
}

export function getPedidoById(id) {
  const db = getDb();
  const pedido = (db.pedidos || []).find((p) => p.id === id);
  if (!pedido) return null;

  const local = (db.locales || []).find((l) => l.id === pedido.local_id);
  const items = (db.pedido_items || []).filter((it) => it.pedido_id === id);
  const pagos = (db.pagos || []).filter((pg) => pg.pedido_id === id);

  return {
    ...pedido,
    local,
    items,
    pagos
  };
}

/**
 * Registra y cobra una venta (POS o cierre de cuenta de mesa).
 * Valida stock, descuenta inventario (incluso componentes de combo),
 * guarda pagos mixtos y libera la mesa si corresponde.
 */
export function procesarCobroVenta({
  pedidoId = null,
  localId,
  tipo = 'llevar',
  mesaId = null,
  numeroMesa = null,
  items = [],
  subtotal = 0,
  descuento = 0,
  total = 0,
  promocionId = null,
  usuarioId = 'usr_admin',
  notas = '',
  pagos = [] // Array de { medio_pago, monto }
}) {
  const db = getDb();
  const stock = db.stock_local || [];
  const comboItems = db.combo_items || [];
  const productos = db.productos || [];

  if (!items || items.length === 0) {
    throw new Error('No se pueden procesar ventas sin productos.');
  }

  // 1. VALIDACIÓN PREVIA DE STOCK
  for (const it of items) {
    const qty = Number(it.cantidad) || 1;
    if (it.es_combo) {
      // Validar cada componente del combo
      const componentes = comboItems.filter((ci) => ci.combo_id === it.combo_id);
      for (const comp of componentes) {
        const stk = stock.find((s) => s.producto_id === comp.producto_id && s.local_id === localId);
        const prod = productos.find((p) => p.id === comp.producto_id);
        const cantRequerida = comp.cantidad * qty;
        const disponible = stk ? stk.stock_actual : 0;
        if (disponible < cantRequerida) {
          throw new Error(
            `Stock insuficiente en el combo para: ${prod ? prod.nombre : 'Componente'}. Requiere ${cantRequerida}, disponible: ${disponible}.`
          );
        }
      }
    } else {
      // Producto regular
      const stk = stock.find((s) => s.producto_id === it.producto_id && s.local_id === localId);
      const prod = productos.find((p) => p.id === it.producto_id);
      const disponible = stk ? stk.stock_actual : 0;
      if (disponible < qty) {
        throw new Error(
          `Stock insuficiente para: ${prod ? prod.nombre : it.nombre}. Requiere ${qty}, disponible: ${disponible}.`
        );
      }
    }
  }

  // 2. CREAR O ACTUALIZAR PEDIDO
  const fechaActual = new Date().toISOString();
  let idPedidoFinal = pedidoId;

  if (pedidoId) {
    const pIndex = db.pedidos.findIndex((p) => p.id === pedidoId);
    if (pIndex !== -1) {
      db.pedidos[pIndex] = {
        ...db.pedidos[pIndex],
        estado: 'cobrado',
        subtotal,
        descuento,
        total,
        promocion_id: promocionId,
        fecha: fechaActual,
        notas: notas || db.pedidos[pIndex].notas
      };
    }
  } else {
    idPedidoFinal = generateId('ped');
    const nuevoPedido = {
      id: idPedidoFinal,
      local_id: localId,
      tipo,
      mesa_id: mesaId,
      numero_mesa: numeroMesa,
      fecha: fechaActual,
      estado: 'cobrado',
      subtotal,
      descuento,
      total,
      promocion_id: promocionId,
      usuario_id: usuarioId,
      notas: notas || (tipo === 'mesa' ? `Mesa ${numeroMesa}` : 'Venta para llevar')
    };
    db.pedidos = db.pedidos || [];
    db.pedidos.push(nuevoPedido);
  }

  // 3. REGISTRAR O ACTUALIZAR ITEMS
  // Si venía de una cuenta abierta, podemos reemplazar o mantener los items
  db.pedido_items = db.pedido_items || [];
  if (pedidoId) {
    // Si ya existía el pedido, eliminamos items previos para registrar los definitivos
    db.pedido_items = db.pedido_items.filter((it) => it.pedido_id !== pedidoId);
  }

  const itemsGuardados = [];
  items.forEach((it) => {
    const prod = productos.find((p) => p.id === it.producto_id);
    const esComida = it.es_comida || (prod ? prod.es_comida : false);

    const nuevoItem = {
      id: generateId('it'),
      pedido_id: idPedidoFinal,
      producto_id: it.producto_id || null,
      combo_id: it.combo_id || null,
      es_combo: Boolean(it.es_combo),
      nombre_item: it.nombre || it.nombre_item,
      cantidad: Number(it.cantidad) || 1,
      precio_unitario: Number(it.precio_unitario || it.precio) || 0,
      subtotal: (Number(it.cantidad) || 1) * (Number(it.precio_unitario || it.precio) || 0),
      notas: it.notas ? it.notas.trim() : '',
      estado_cocina: esComida ? 'pendiente' : 'no_aplica'
    };
    db.pedido_items.push(nuevoItem);
    itemsGuardados.push(nuevoItem);
  });

  // 4. REGISTRAR PAGOS (Soporte pago mixto)
  db.pagos = db.pagos || [];
  const pagosGuardados = [];
  pagos.forEach((pg) => {
    const nuevoPago = {
      id: generateId('pag'),
      pedido_id: idPedidoFinal,
      medio_pago: pg.medio_pago,
      monto: Number(pg.monto) || 0,
      fecha: fechaActual
    };
    db.pagos.push(nuevoPago);
    pagosGuardados.push(nuevoPago);
  });

  // 5. DESCONTAR STOCK Y REGISTRAR MOVIMIENTOS
  db.movimientos_stock = db.movimientos_stock || [];

  items.forEach((it) => {
    const qty = Number(it.cantidad) || 1;
    if (it.es_combo) {
      const componentes = comboItems.filter((ci) => ci.combo_id === it.combo_id);
      componentes.forEach((comp) => {
        const stk = stock.find((s) => s.producto_id === comp.producto_id && s.local_id === localId);
        const cantADescontar = comp.cantidad * qty;
        if (stk) {
          stk.stock_actual = Math.max(0, stk.stock_actual - cantADescontar);
        }
        db.movimientos_stock.push({
          id: generateId('mov'),
          local_id: localId,
          producto_id: comp.producto_id,
          tipo: 'venta',
          cantidad: cantADescontar,
          motivo: `Venta Combo #${it.nombre || it.combo_id} (Pedido #${idPedidoFinal.slice(-6)})`,
          fecha: fechaActual,
          usuario_id: usuarioId
        });
      });
    } else {
      const stk = stock.find((s) => s.producto_id === it.producto_id && s.local_id === localId);
      if (stk) {
        stk.stock_actual = Math.max(0, stk.stock_actual - qty);
      }
      db.movimientos_stock.push({
        id: generateId('mov'),
        local_id: localId,
        producto_id: it.producto_id,
        tipo: 'venta',
        cantidad: qty,
        motivo: `Venta Pedido #${idPedidoFinal.slice(-6)}`,
        fecha: fechaActual,
        usuario_id: usuarioId
      });
    }
  });

  // 6. LIBERAR MESA SI ERA VENTA EN MESA
  if (tipo === 'mesa' && mesaId) {
    const mesa = (db.mesas || []).find((m) => m.id === mesaId);
    if (mesa) {
      mesa.estado = 'libre';
    }
  }

  saveDb(db);

  const local = (db.locales || []).find((l) => l.id === localId);
  const pedidoFinalObj = (db.pedidos || []).find((p) => p.id === idPedidoFinal);

  return {
    pedido: pedidoFinalObj,
    local,
    items: itemsGuardados,
    pagos: pagosGuardados
  };
}

/**
 * Obtiene los items de comida para la pantalla de cocina (Solo General Paz)
 */
export function getPedidosCocina(localId = 'loc_gpaz') {
  const db = getDb();
  if (localId !== 'loc_gpaz') return [];

  const pedidos = db.pedidos || [];
  const items = db.pedido_items || [];
  const mesas = db.mesas || [];

  // Filtrar items con estado de cocina activo (pendiente, en_preparacion, listo)
  const itemsCocina = items.filter(
    (it) => it.estado_cocina && it.estado_cocina !== 'no_aplica'
  );

  return itemsCocina
    .map((it) => {
      const pedido = pedidos.find((p) => p.id === it.pedido_id);
      const mesa = pedido && pedido.mesa_id ? mesas.find((m) => m.id === pedido.mesa_id) : null;
      return {
        ...it,
        pedido_fecha: pedido ? pedido.fecha : null,
        pedido_tipo: pedido ? pedido.tipo : 'mesa',
        numero_mesa: pedido ? pedido.numero_mesa || (mesa ? mesa.numero : 'S/M') : 'S/M'
      };
    })
    .sort((a, b) => new Date(a.pedido_fecha || 0) - new Date(b.pedido_fecha || 0));
}

export function actualizarEstadoCocinaItem(itemId, nuevoEstado) {
  const db = getDb();
  const it = (db.pedido_items || []).find((i) => i.id === itemId);
  if (!it) throw new Error('Item no encontrado');

  it.estado_cocina = nuevoEstado;
  saveDb(db);
  return it;
}

/**
 * Servicio para gestión y ajuste de inventario/stock por local
 */

import { getDb, saveDb, generateId } from './db';

export function getStockByLocal(localId) {
  const db = getDb();
  const productos = db.productos || [];
  const categorias = db.categorias || [];
  const stock = db.stock_local || [];
  const precios = db.precios_local || [];

  return productos
    .filter((p) => {
      if (p.activo === false) return false;
      if (localId === 'loc_yofre' && (p.es_comida || p.categoria_id === 'cat_comidas')) {
        return false;
      }
      return true;
    })
    .map((p) => {
      const cat = categorias.find((c) => c.id === p.categoria_id);
      const stk = stock.find((s) => s.producto_id === p.id && s.local_id === localId);
      const prc = precios.find((pr) => pr.producto_id === p.id && pr.local_id === localId);

      const actual = stk ? stk.stock_actual : 0;
      const minimo = stk ? stk.stock_minimo : 5;

      return {
        producto_id: p.id,
        nombre: p.nombre,
        categoria_id: p.categoria_id,
        categoria_nombre: cat ? cat.nombre : 'Sin categoría',
        es_comida: p.es_comida,
        precio: prc ? prc.precio : 0,
        stock_actual: actual,
        stock_minimo: minimo,
        es_bajo_stock: actual <= minimo
      };
    })
    .sort((a, b) => {
      // Priorizar los de stock bajo arriba
      if (a.es_bajo_stock && !b.es_bajo_stock) return -1;
      if (!a.es_bajo_stock && b.es_bajo_stock) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
}

export function ajustarStock(localId, productoId, nuevoStock, motivo = 'Ajuste manual', usuarioId = 'usr_admin') {
  const db = getDb();
  let stk = (db.stock_local || []).find((s) => s.producto_id === productoId && s.local_id === localId);
  const stockAnterior = stk ? stk.stock_actual : 0;
  const stockFinal = Math.max(0, Number(nuevoStock));

  if (stk) {
    stk.stock_actual = stockFinal;
  } else {
    stk = {
      id: generateId('stk'),
      producto_id: productoId,
      local_id: localId,
      stock_actual: stockFinal,
      stock_minimo: 5
    };
    db.stock_local.push(stk);
  }

  // Registrar movimiento
  const diferencia = stockFinal - stockAnterior;
  const movimiento = {
    id: generateId('mov'),
    local_id: localId,
    producto_id: productoId,
    tipo: diferencia >= 0 ? 'entrada' : 'salida',
    cantidad: Math.abs(diferencia),
    motivo: motivo || 'Ajuste de inventario',
    fecha: new Date().toISOString(),
    usuario_id: usuarioId
  };
  db.movimientos_stock = db.movimientos_stock || [];
  db.movimientos_stock.push(movimiento);

  saveDb(db);
  return stk;
}

export function getStockBajo(localId = null) {
  const db = getDb();
  const locales = db.locales || [];
  const targetLocales = localId ? locales.filter((l) => l.id === localId) : locales;

  const resultados = [];
  targetLocales.forEach((loc) => {
    const items = getStockByLocal(loc.id);
    const bajos = items.filter((i) => i.es_bajo_stock);
    bajos.forEach((b) => {
      resultados.push({
        ...b,
        local_id: loc.id,
        local_nombre: loc.nombre
      });
    });
  });

  return resultados;
}

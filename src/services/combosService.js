/**
 * Servicio para gestión de combos y paquetes promocionales
 */

import { getDb, saveDb, generateId } from './db';

export function getCombos(localId = null) {
  const db = getDb();
  const combos = db.combos || [];
  const comboItems = db.combo_items || [];
  const productos = db.productos || [];

  return combos
    .filter((c) => {
      if (c.activo === false) return false;
      // Si localId es Yofre, no mostrar combos que tengan comida o sean solo de General Paz
      if (localId === 'loc_yofre' && c.local_id === 'loc_gpaz') return false;
      return true;
    })
    .map((c) => {
      const items = comboItems
        .filter((ci) => ci.combo_id === c.id)
        .map((ci) => {
          const prod = productos.find((p) => p.id === ci.producto_id);
          return {
            ...ci,
            producto_nombre: prod ? prod.nombre : 'Producto desconocido',
            es_comida: prod ? prod.es_comida : false
          };
        });

      return {
        ...c,
        items
      };
    });
}

export function crearCombo(comboData, items = []) {
  const db = getDb();
  const newComboId = generateId('cmb');

  const nuevoCombo = {
    id: newComboId,
    nombre: comboData.nombre.trim(),
    descripcion: comboData.descripcion ? comboData.descripcion.trim() : '',
    precio_venta: Number(comboData.precio_venta) || 0,
    local_id: comboData.local_id || null,
    activo: true
  };

  db.combos.push(nuevoCombo);

  items.forEach((item) => {
    db.combo_items.push({
      combo_id: newComboId,
      producto_id: item.producto_id,
      cantidad: Number(item.cantidad) || 1
    });
  });

  saveDb(db);
  return nuevoCombo;
}

export function actualizarCombo(id, comboData, items = null) {
  const db = getDb();
  const cIndex = (db.combos || []).findIndex((c) => c.id === id);
  if (cIndex === -1) throw new Error('Combo no encontrado');

  db.combos[cIndex] = {
    ...db.combos[cIndex],
    nombre: comboData.nombre ? comboData.nombre.trim() : db.combos[cIndex].nombre,
    descripcion: comboData.descripcion !== undefined ? comboData.descripcion.trim() : db.combos[cIndex].descripcion,
    precio_venta: comboData.precio_venta !== undefined ? Number(comboData.precio_venta) : db.combos[cIndex].precio_venta,
    local_id: comboData.local_id !== undefined ? comboData.local_id : db.combos[cIndex].local_id,
    activo: comboData.activo !== undefined ? comboData.activo : db.combos[cIndex].activo
  };

  if (items && Array.isArray(items)) {
    // Reemplazar items
    db.combo_items = (db.combo_items || []).filter((ci) => ci.combo_id !== id);
    items.forEach((item) => {
      db.combo_items.push({
        combo_id: id,
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad) || 1
      });
    });
  }

  saveDb(db);
  return db.combos[cIndex];
}

export function eliminarCombo(id) {
  const db = getDb();
  const combo = (db.combos || []).find((c) => c.id === id);
  if (combo) {
    combo.activo = false;
    saveDb(db);
    return true;
  }
  return false;
}

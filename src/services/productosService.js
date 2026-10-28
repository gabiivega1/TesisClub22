/**
 * Servicio de productos con catálogo unificado y precios/stock relacionales por local.
 */

import { getTable, getDb, saveDb, insertRecord, updateRecord, generateId } from './db';

export function getCategorias() {
  return getTable('categorias');
}

export function getProductos(localId = null, soloActivos = true) {
  const db = getDb();
  const productos = db.productos || [];
  const categorias = db.categorias || [];
  const precios = db.precios_local || [];
  const stock = db.stock_local || [];

  return productos
    .filter((p) => {
      if (soloActivos && p.activo === false) return false;
      // Club 22 Yofre NO tiene cocina ni comida
      if (localId === 'loc_yofre' && (p.es_comida || p.categoria_id === 'cat_comidas')) {
        return false;
      }
      return true;
    })
    .map((p) => {
      const cat = categorias.find((c) => c.id === p.categoria_id);

      let precioFinal = 0;
      let stockActual = 0;
      let stockMinimo = 5;

      if (localId) {
        const prc = precios.find((pr) => pr.producto_id === p.id && pr.local_id === localId);
        precioFinal = prc ? prc.precio : 0;

        const stk = stock.find((s) => s.producto_id === p.id && s.local_id === localId);
        stockActual = stk ? stk.stock_actual : 0;
        stockMinimo = stk ? stk.stock_minimo : 5;
      }

      return {
        ...p,
        categoria_nombre: cat ? cat.nombre : 'Sin categoría',
        precio: precioFinal,
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        es_bajo_stock: stockActual <= stockMinimo
      };
    });
}

export function getProductoDetalle(id) {
  const db = getDb();
  const producto = (db.productos || []).find((p) => p.id === id);
  if (!producto) return null;

  const precios = (db.precios_local || []).filter((pr) => pr.producto_id === id);
  const stock = (db.stock_local || []).filter((s) => s.producto_id === id);

  return {
    ...producto,
    precios,
    stock
  };
}

export function crearProducto(productoData, preciosPorLocal = {}, stockPorLocal = {}) {
  const db = getDb();
  const newId = generateId('prod');

  const nuevoProducto = {
    id: newId,
    categoria_id: productoData.categoria_id,
    nombre: productoData.nombre.trim(),
    descripcion: productoData.descripcion ? productoData.descripcion.trim() : '',
    es_comida: Boolean(productoData.es_comida),
    activo: true
  };

  db.productos.push(nuevoProducto);

  // Si no es comida, puede tener precio en Yofre
  if (!nuevoProducto.es_comida && preciosPorLocal.loc_yofre !== undefined) {
    db.precios_local.push({
      id: generateId('prc'),
      producto_id: newId,
      local_id: 'loc_yofre',
      precio: Number(preciosPorLocal.loc_yofre) || 0
    });
    db.stock_local.push({
      id: generateId('stk'),
      producto_id: newId,
      local_id: 'loc_yofre',
      stock_actual: Number(stockPorLocal.loc_yofre?.stock_actual) || 0,
      stock_minimo: Number(stockPorLocal.loc_yofre?.stock_minimo) || 5
    });
  }

  // Precios y stock para General Paz
  if (preciosPorLocal.loc_gpaz !== undefined) {
    db.precios_local.push({
      id: generateId('prc'),
      producto_id: newId,
      local_id: 'loc_gpaz',
      precio: Number(preciosPorLocal.loc_gpaz) || 0
    });
    db.stock_local.push({
      id: generateId('stk'),
      producto_id: newId,
      local_id: 'loc_gpaz',
      stock_actual: Number(stockPorLocal.loc_gpaz?.stock_actual) || 0,
      stock_minimo: Number(stockPorLocal.loc_gpaz?.stock_minimo) || 5
    });
  }

  saveDb(db);
  return nuevoProducto;
}

export function actualizarProducto(id, productoData, preciosPorLocal = {}) {
  const db = getDb();
  const index = (db.productos || []).findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Producto no encontrado');

  const esComida = productoData.es_comida !== undefined ? Boolean(productoData.es_comida) : db.productos[index].es_comida;

  db.productos[index] = {
    ...db.productos[index],
    nombre: productoData.nombre ? productoData.nombre.trim() : db.productos[index].nombre,
    descripcion: productoData.descripcion !== undefined ? productoData.descripcion.trim() : db.productos[index].descripcion,
    categoria_id: productoData.categoria_id || db.productos[index].categoria_id,
    es_comida: esComida,
    activo: productoData.activo !== undefined ? productoData.activo : db.productos[index].activo
  };

  // Actualizar o insertar precios
  ['loc_yofre', 'loc_gpaz'].forEach((locId) => {
    // Si es comida, Yofre no tiene precio
    if (locId === 'loc_yofre' && esComida) {
      db.precios_local = db.precios_local.filter((pr) => !(pr.producto_id === id && pr.local_id === 'loc_yofre'));
      db.stock_local = db.stock_local.filter((st) => !(st.producto_id === id && st.local_id === 'loc_yofre'));
      return;
    }

    if (preciosPorLocal[locId] !== undefined) {
      const nuevoPrecio = Number(preciosPorLocal[locId]);
      const prcIndex = db.precios_local.findIndex((pr) => pr.producto_id === id && pr.local_id === locId);
      if (prcIndex !== -1) {
        db.precios_local[prcIndex].precio = nuevoPrecio;
      } else {
        db.precios_local.push({
          id: generateId('prc'),
          producto_id: id,
          local_id: locId,
          precio: nuevoPrecio
        });
      }
    }
  });

  saveDb(db);
  return db.productos[index];
}

export function eliminarProducto(id) {
  // Desactivar lógicamente para no romper integridad relacional de ventas históricas
  const db = getDb();
  const prod = (db.productos || []).find((p) => p.id === id);
  if (prod) {
    prod.activo = false;
    saveDb(db);
    return true;
  }
  return false;
}

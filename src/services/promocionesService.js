/**
 * Servicio para gestión y aplicación de promociones y descuentos al cierre de venta
 */

import { getDb, saveDb, generateId } from './db';

export function getPromociones(soloActivas = true) {
  const db = getDb();
  const promos = db.promociones || [];
  return promos.filter((p) => (soloActivas ? p.activo !== false : true));
}

export function calcularDescuento(promocion, subtotal, medioPago = null) {
  if (!promocion || !subtotal || subtotal <= 0) return 0;

  // Promoción condicionada a medio de pago (ej. 10% en Efectivo)
  if (promocion.tipo === 'medio_pago') {
    if (medioPago && promocion.medio_pago_condicion && medioPago !== promocion.medio_pago_condicion) {
      return 0;
    }
  }

  // Promoción con monto mínimo
  if (promocion.monto_minimo && subtotal < promocion.monto_minimo) {
    return 0;
  }

  let descuento = 0;
  if (promocion.descuento_porcentaje > 0) {
    descuento = (subtotal * promocion.descuento_porcentaje) / 100;
  } else if (promocion.descuento_fijo > 0) {
    descuento = Math.min(subtotal, promocion.descuento_fijo);
  }

  return Math.round(descuento);
}

export function crearPromocion(promoData) {
  const db = getDb();
  const nuevaPromo = {
    id: generateId('prm'),
    nombre: promoData.nombre.trim(),
    tipo: promoData.tipo || 'general',
    medio_pago_condicion: promoData.medio_pago_condicion || null,
    descuento_porcentaje: Number(promoData.descuento_porcentaje) || 0,
    descuento_fijo: Number(promoData.descuento_fijo) || 0,
    monto_minimo: Number(promoData.monto_minimo) || 0,
    activo: true
  };

  db.promociones = db.promociones || [];
  db.promociones.push(nuevaPromo);
  saveDb(db);
  return nuevaPromo;
}

export function actualizarPromocion(id, promoData) {
  const db = getDb();
  const index = (db.promociones || []).findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Promoción no encontrada');

  db.promociones[index] = {
    ...db.promociones[index],
    nombre: promoData.nombre ? promoData.nombre.trim() : db.promociones[index].nombre,
    tipo: promoData.tipo || db.promociones[index].tipo,
    medio_pago_condicion: promoData.medio_pago_condicion !== undefined ? promoData.medio_pago_condicion : db.promociones[index].medio_pago_condicion,
    descuento_porcentaje: promoData.descuento_porcentaje !== undefined ? Number(promoData.descuento_porcentaje) : db.promociones[index].descuento_porcentaje,
    descuento_fijo: promoData.descuento_fijo !== undefined ? Number(promoData.descuento_fijo) : db.promociones[index].descuento_fijo,
    monto_minimo: promoData.monto_minimo !== undefined ? Number(promoData.monto_minimo) : db.promociones[index].monto_minimo,
    activo: promoData.activo !== undefined ? promoData.activo : db.promociones[index].activo
  };

  saveDb(db);
  return db.promociones[index];
}

export function eliminarPromocion(id) {
  const db = getDb();
  const promo = (db.promociones || []).find((p) => p.id === id);
  if (promo) {
    promo.activo = false;
    saveDb(db);
    return true;
  }
  return false;
}

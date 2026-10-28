/**
 * Servicio de métricas y reportes para el Dashboard de Club 22
 */

import { getDb } from './db';
import { getStockBajo } from './stockService';

export function getDashboardMetrics(localId = null) {
  const db = getDb();
  const pedidos = db.pedidos || [];
  const pedidoItems = db.pedido_items || [];
  const productos = db.productos || [];

  // Filtrar pedidos cobrados (o activos)
  const pedidosCobrados = pedidos.filter((p) => {
    if (p.estado !== 'cobrado') return false;
    if (localId && p.local_id !== localId) return false;
    return true;
  });

  // Ventas de hoy
  const hoyStr = new Date().toISOString().split('T')[0];
  const pedidosHoy = pedidosCobrados.filter((p) => p.fecha && p.fecha.startsWith(hoyStr));

  const totalVentasHoy = pedidosHoy.reduce((acc, p) => acc + (p.total || 0), 0);
  const cantidadPedidosHoy = pedidosHoy.length;
  const ticketPromedioHoy = cantidadPedidosHoy > 0 ? Math.round(totalVentasHoy / cantidadPedidosHoy) : 0;

  // Productos con stock bajo
  const productosBajoStock = getStockBajo(localId);

  // Top productos más vendidos
  const pedidosIds = new Set(pedidosCobrados.map((p) => p.id));
  const ventasPorProducto = {};

  pedidoItems.forEach((it) => {
    if (!pedidosIds.has(it.pedido_id)) return;
    const key = it.es_combo ? `combo_${it.combo_id}` : `prod_${it.producto_id}`;
    if (!ventasPorProducto[key]) {
      ventasPorProducto[key] = {
        nombre: it.nombre_item,
        es_combo: it.es_combo,
        cantidad_total: 0,
        monto_total: 0
      };
    }
    ventasPorProducto[key].cantidad_total += it.cantidad || 0;
    ventasPorProducto[key].monto_total += it.subtotal || 0;
  });

  const topProductos = Object.values(ventasPorProducto)
    .sort((a, b) => b.cantidad_total - a.cantidad_total)
    .slice(0, 5);

  // Ventas últimos 7 días
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const ultimos7Dias = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const diaNombre = diasSemana[d.getDay()];

    const pedidosDelDia = pedidosCobrados.filter((p) => p.fecha && p.fecha.startsWith(dateStr));
    const totalDia = pedidosDelDia.reduce((acc, p) => acc + (p.total || 0), 0);

    ultimos7Dias.push({
      fecha: dateStr,
      diaNombre: `${diaNombre} ${d.getDate()}/${d.getMonth() + 1}`,
      cantidadPedidos: pedidosDelDia.length,
      totalFacturado: totalDia
    });
  }

  return {
    totalVentasHoy,
    cantidadPedidosHoy,
    ticketPromedioHoy,
    productosBajoStock,
    topProductos,
    ultimos7Dias
  };
}

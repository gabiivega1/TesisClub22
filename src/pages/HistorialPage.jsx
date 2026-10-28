import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPedidos } from '../services/pedidosService';
import { formatCurrency, formatDate, formatPaymentMethod } from '../utils/formatters';

export default function HistorialPage() {
  const { activeLocalId, isAdmin } = useAuth();
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // Si es admin puede ver todos los locales en el historial
    const data = getPedidos(isAdmin ? null : activeLocalId, 30);
    setPedidos(data);
  }, [activeLocalId, isAdmin]);

  return (
    <div className="app-container">
      <div className="page-title">
        <div>Historial de Ventas y Auditoría</div>
        <span className="badge badge-ocupada">ETAPA 3 — PRÓXIMAMENTE (Filtros Avanzados)</span>
      </div>

      <div className="alert alert-info">
        <strong>Aviso de Avance:</strong> Pantalla con vista preliminar de auditoría de ventas. Próximamente incluirá filtros avanzados por rango de fechas, cajero/usuario, exportación a Excel/PDF y reimpresión de tickets fiscales.
      </div>

      <div className="card">
        <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Últimas Ventas Registradas en el Sistema</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Fecha y Hora</th>
                <th>Local</th>
                <th>Tipo</th>
                <th className="text-right">Subtotal</th>
                <th className="text-right">Descuento</th>
                <th className="text-right">Total Facturado</th>
                <th>Medio(s) de Pago</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center" style={{ color: '#888', padding: '16px' }}>
                    No hay registros de ventas.
                  </td>
                </tr>
              ) : (
                pedidos.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.id.slice(-8)}</code></td>
                    <td>{formatDate(p.fecha)}</td>
                    <td><strong>{p.local_nombre}</strong></td>
                    <td>
                      {p.tipo === 'mesa' ? `Mesa #${p.numero_mesa || 'S/M'}` : 'Para Llevar'}
                    </td>
                    <td className="text-right">{formatCurrency(p.subtotal)}</td>
                    <td className="text-right" style={{ color: p.descuento > 0 ? '#c62828' : undefined }}>
                      {p.descuento > 0 ? `-${formatCurrency(p.descuento)}` : '$0,00'}
                    </td>
                    <td className="text-right">
                      <strong>{formatCurrency(p.total)}</strong>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {p.pagos && p.pagos.length > 0 ? (
                        p.pagos.map((pg, idx) => (
                          <div key={idx}>
                            • {formatPaymentMethod(pg.medio_pago)} ({formatCurrency(pg.monto)})
                          </div>
                        ))
                      ) : (
                        'Efectivo'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

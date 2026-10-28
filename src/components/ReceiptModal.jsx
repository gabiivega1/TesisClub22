import React from 'react';
import { formatCurrency, formatDate, formatPaymentMethod } from '../utils/formatters';

export default function ReceiptModal({ receiptData, onClose }) {
  if (!receiptData) return null;

  const { pedido, local, items, pagos } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Comprobante de Venta Emitido</h3>
          <button onClick={onClose} className="btn btn-sm">
            ✕ Cerrar
          </button>
        </div>

        <div className="ticket-receipt" id="ticket-print-area">
          <div className="ticket-header">
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>CLUB 22</h2>
            <p><strong>{local?.nombre || 'Club 22'}</strong></p>
            <p>{local?.direccion || 'Córdoba, Argentina'}</p>
            <p>Tel: {local?.telefono || '0351-4500000'}</p>
            <p>IVA Responsable Inscripto — Ticket No Fiscal</p>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <p><strong>Ticket #:</strong> {pedido?.id?.slice(-8)}</p>
            <p><strong>Fecha:</strong> {formatDate(pedido?.fecha)}</p>
            <p>
              <strong>Modalidad:</strong>{' '}
              {pedido?.tipo === 'mesa' ? `En Mesa (Mesa #${pedido?.numero_mesa || 'S/M'})` : 'Para llevar'}
            </p>
            {pedido?.notas && <p><strong>Nota:</strong> {pedido.notas}</p>}
          </div>

          <table style={{ width: '100%', marginBottom: '10px', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Cant / Descripción</th>
                <th style={{ textAlign: 'right' }}>P.Unit</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items && items.map((it, idx) => (
                <tr key={idx}>
                  <td>
                    {it.cantidad}x {it.nombre_item}
                    {it.notas && (
                      <div style={{ fontSize: '11px', color: '#555' }}>({it.notas})</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(it.precio_unitario)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #666', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(pedido?.subtotal)}</span>
            </div>

            {pedido?.descuento > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#8b1812' }}>
                <span>Descuento aplicado:</span>
                <span>-{formatCurrency(pedido?.descuento)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '15px',
                fontWeight: 'bold',
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid #111'
              }}
            >
              <span>TOTAL ARS:</span>
              <span>{formatCurrency(pedido?.total)}</span>
            </div>
          </div>

          <div style={{ marginTop: '12px', borderTop: '1px dashed #666', paddingTop: '8px' }}>
            <p><strong>Detalle de Pagos:</strong></p>
            {pagos && pagos.map((pg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>• {formatPaymentMethod(pg.medio_pago)}:</span>
                <span>{formatCurrency(pg.monto)}</span>
              </div>
            ))}
          </div>

          <div className="ticket-footer">
            <p>¡Muchas gracias por su visita a Club 22!</p>
            <p>Conserve este ticket para cualquier consulta.</p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button onClick={handlePrint} className="btn">
            Imprimir Ticket
          </button>
          <button onClick={onClose} className="btn btn-primary">
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

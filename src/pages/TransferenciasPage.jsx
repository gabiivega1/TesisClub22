import React from 'react';

export default function TransferenciasPage() {
  return (
    <div className="app-container">
      <div className="page-title">
        <div>Transferencias de Stock entre Locales</div>
        <span className="badge badge-ocupada">ETAPA 3 — EN DESARROLLO</span>
      </div>

      <div className="card" style={{ padding: '30px', textAlign: 'center', backgroundColor: '#fafafa' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Próximamente: Módulo de Logística y Transferencias</h2>
        <p style={{ maxWidth: '650px', margin: '0 auto 16px', color: '#555', fontSize: '14px' }}>
          Este módulo permitirá coordinar el envío y recepción de mercadería (vinos, destilados y descartables) entre Club 22 Yofre y Club 22 General Paz mediante remitos digitales internos con estados: <em>Pendiente de Despacho</em>, <em>En Tránsito</em> y <em>Recepción y Confirmación en Destino</em> con impacto directo en el stock de ambos puntos de venta.
        </p>

        <div style={{ border: '1px dashed #888', padding: '16px', maxWidth: '400px', margin: '0 auto', fontSize: '13px', backgroundColor: '#fff' }}>
          <strong>Estructura Relacional Preparada en BD:</strong>
          <div style={{ marginTop: '8px', color: '#666' }}>
            Tabla <code>transferencias_stock</code> (id, local_origen_id, local_destino_id, producto_id, cantidad, estado, fecha_creacion).
          </div>
        </div>
      </div>
    </div>
  );
}

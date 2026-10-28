import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPedidosCocina, actualizarEstadoCocinaItem } from '../services/pedidosService';
import { formatDate } from '../utils/formatters';
import AlertMessage from '../components/AlertMessage';

export default function CocinaPage() {
  const { activeLocalId, activeLocal, isAdmin, switchActiveLocal } = useAuth();
  const [itemsCocina, setItemsCocina] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  const cargarCocina = () => {
    if (activeLocalId === 'loc_gpaz') {
      const data = getPedidosCocina('loc_gpaz');
      setItemsCocina(data);
    }
  };

  useEffect(() => {
    cargarCocina();
  }, [activeLocalId]);

  const handleCambiarEstado = (itemId, nuevoEstado, nombreItem) => {
    try {
      actualizarEstadoCocinaItem(itemId, nuevoEstado);
      cargarCocina();
      setMensaje({
        type: 'success',
        text: `Item "${nombreItem}" pasó a estado: ${nuevoEstado.toUpperCase()}.`
      });
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message || 'Error al actualizar comanda.' });
    }
  };

  if (activeLocalId !== 'loc_gpaz') {
    return (
      <div className="app-container">
        <div className="page-title">
          <div>Pantalla de Cocina</div>
        </div>

        <div className="alert alert-warning" style={{ padding: '24px', fontSize: '15px' }}>
          <h3 style={{ marginBottom: '8px' }}>Módulo no disponible para {activeLocal?.nombre}</h3>
          <p>
            El local <strong>Club 22 Yofre</strong> opera exclusivamente con bebidas y coctelería (no posee cocina ni elaboración de comidas calientes).
          </p>
          <p style={{ marginTop: '12px' }}>
            La cocina y comanderas funcionan en <strong>Club 22 General Paz</strong>.
          </p>

          {isAdmin && (
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => switchActiveLocal('loc_gpaz')}
                className="btn btn-primary"
              >
                Cambiar a Club 22 General Paz
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Clasificar en 3 columnas
  const pendientes = itemsCocina.filter((i) => i.estado_cocina === 'pendiente');
  const enPreparacion = itemsCocina.filter((i) => i.estado_cocina === 'en_preparacion');
  const listos = itemsCocina.filter((i) => i.estado_cocina === 'listo');

  return (
    <div className="app-container">
      <div className="page-title">
        <div>
          Pantalla de Cocina y Despacho — <strong>Club 22 General Paz</strong>
        </div>
        <button onClick={cargarCocina} className="btn btn-sm">
          ↻ Actualizar Comandas
        </button>
      </div>

      <AlertMessage
        type={mensaje?.type}
        message={mensaje?.text}
        onClose={() => setMensaje(null)}
      />

      <div className="cocina-grid">
        {/* COLUMNA 1: PENDIENTES */}
        <div className="cocina-col">
          <div className="cocina-col-header" style={{ borderTop: '4px solid #b78103' }}>
            <span>PENDIENTES</span>
            <span>({pendientes.length})</span>
          </div>

          <div style={{ padding: '8px' }}>
            {pendientes.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '30px 10px', fontSize: '13px' }}>
                No hay platos pendientes de inicio.
              </p>
            ) : (
              pendientes.map((item) => (
                <div key={item.id} className="cocina-card" style={{ borderLeft: '4px solid #b78103' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {item.pedido_tipo === 'mesa' ? `Mesa #${item.numero_mesa}` : 'Para Llevar'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#666' }}>{formatDate(item.pedido_fecha)}</span>
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '6px 0' }}>
                    {item.cantidad}x {item.nombre_item}
                  </div>

                  {item.notas && (
                    <div style={{ backgroundColor: '#fff9db', padding: '4px 6px', fontSize: '12px', border: '1px solid #ffe066', marginBottom: '8px' }}>
                      Nota: <strong>{item.notas}</strong>
                    </div>
                  )}

                  <button
                    onClick={() => handleCambiarEstado(item.id, 'en_preparacion', item.nombre_item)}
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    Comenzar Preparación →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 2: EN PREPARACIÓN */}
        <div className="cocina-col">
          <div className="cocina-col-header" style={{ borderTop: '4px solid #0277bd' }}>
            <span>EN PREPARACIÓN</span>
            <span>({enPreparacion.length})</span>
          </div>

          <div style={{ padding: '8px' }}>
            {enPreparacion.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '30px 10px', fontSize: '13px' }}>
                No hay platos elaborándose en este momento.
              </p>
            ) : (
              enPreparacion.map((item) => (
                <div key={item.id} className="cocina-card" style={{ borderLeft: '4px solid #0277bd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {item.pedido_tipo === 'mesa' ? `Mesa #${item.numero_mesa}` : 'Para Llevar'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#666' }}>{formatDate(item.pedido_fecha)}</span>
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '6px 0' }}>
                    {item.cantidad}x {item.nombre_item}
                  </div>

                  {item.notas && (
                    <div style={{ backgroundColor: '#e7f5ff', padding: '4px 6px', fontSize: '12px', border: '1px solid #a5d8ff', marginBottom: '8px' }}>
                      Nota: <strong>{item.notas}</strong>
                    </div>
                  )}

                  <button
                    onClick={() => handleCambiarEstado(item.id, 'listo', item.nombre_item)}
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%', marginTop: '4px', backgroundColor: '#2e7d32', borderColor: '#1b5e20' }}
                  >
                    ✓ Marcar como Listo →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 3: LISTO / DESPACHO */}
        <div className="cocina-col">
          <div className="cocina-col-header" style={{ borderTop: '4px solid #2e7d32' }}>
            <span>LISTO PARA SERVIR</span>
            <span>({listos.length})</span>
          </div>

          <div style={{ padding: '8px' }}>
            {listos.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '30px 10px', fontSize: '13px' }}>
                No hay platos listos pendientes de entrega.
              </p>
            ) : (
              listos.map((item) => (
                <div key={item.id} className="cocina-card" style={{ borderLeft: '4px solid #2e7d32', backgroundColor: '#f6fff6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: '#1b5e20' }}>
                      {item.pedido_tipo === 'mesa' ? `Mesa #${item.numero_mesa}` : 'Para Llevar'}
                    </span>
                    <span className="badge badge-listo">Listo</span>
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '6px 0' }}>
                    {item.cantidad}x {item.nombre_item}
                  </div>

                  {item.notas && (
                    <div style={{ fontSize: '12px', color: '#444', marginBottom: '6px' }}>
                      Nota: {item.notas}
                    </div>
                  )}

                  <button
                    onClick={() => handleCambiarEstado(item.id, 'entregado', item.nombre_item)}
                    className="btn btn-sm"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    Marcar como Entregado
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

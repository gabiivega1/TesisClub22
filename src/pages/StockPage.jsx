import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStockByLocal, ajustarStock } from '../services/stockService';
import { formatCurrency } from '../utils/formatters';
import AlertMessage from '../components/AlertMessage';

export default function StockPage() {
  const { activeLocalId, activeLocal, user, isAdmin, locales, switchActiveLocal } = useAuth();
  const [stockList, setStockList] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [soloBajoStock, setSoloBajoStock] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Modal de ajuste manual
  const [itemAjustando, setItemAjustando] = useState(null);
  const [nuevoStockInput, setNuevoStockInput] = useState('');

  const cargarStock = () => {
    const list = getStockByLocal(activeLocalId);
    setStockList(list);
  };

  useEffect(() => {
    cargarStock();
  }, [activeLocalId]);

  const abrirAjuste = (item) => {
    setItemAjustando(item);
    setNuevoStockInput(String(item.stock_actual));
  };

  const handleGuardarAjuste = (e) => {
    e.preventDefault();
    if (nuevoStockInput === '' || isNaN(Number(nuevoStockInput)) || Number(nuevoStockInput) < 0) {
      setMensaje({ type: 'danger', text: 'Ingrese un número válido mayor o igual a 0.' });
      return;
    }

    try {
      ajustarStock(
        activeLocalId,
        itemAjustando.producto_id,
        Number(nuevoStockInput),
        'Ajuste manual',
        user?.id || 'usr_admin'
      );
      setMensaje({
        type: 'success',
        text: `Stock de "${itemAjustando.nombre}" actualizado a ${nuevoStockInput} unidades.`
      });
      setItemAjustando(null);
      cargarStock();
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message || 'Error al ajustar stock.' });
    }
  };

  const filtrados = stockList.filter((item) => {
    const matchTexto = item.nombre.toLowerCase().includes(filtroTexto.toLowerCase());
    const matchBajo = soloBajoStock ? item.es_bajo_stock : true;
    return matchTexto && matchBajo;
  });

  return (
    <div className="app-container">
      <div className="page-title">
        <div>
          Gestión de Inventario y Stock — <strong>{activeLocal?.nombre}</strong>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px' }}>Cambiar local:</label>
            <select
              value={activeLocalId}
              onChange={(e) => switchActiveLocal(e.target.value)}
              style={{ width: 'auto' }}
            >
              {locales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <AlertMessage
        type={mensaje?.type}
        message={mensaje?.text}
        onClose={() => setMensaje(null)}
      />

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Buscar producto:</label>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>

        <div style={{ paddingTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={soloBajoStock}
              onChange={(e) => setSoloBajoStock(e.target.checked)}
            />
            <span style={{ fontWeight: 'bold', color: '#c62828' }}>
              Mostrar solo productos con Stock Bajo
            </span>
          </label>
        </div>
      </div>

      {/* Tabla de Stock */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th className="text-right">Precio en este local</th>
              <th className="text-center">Stock Actual</th>
              <th className="text-center">Stock Mínimo</th>
              <th className="text-center">Condición</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center" style={{ padding: '24px', color: '#666' }}>
                  {stockList.length === 0
                    ? 'No hay productos en inventario aún para este local. Cargue productos y su stock inicial en la pestaña "Productos & Precios".'
                    : 'No se encontraron productos con los filtros aplicados.'}
                </td>
              </tr>
            ) : (
              filtrados.map((item) => (
                <tr
                  key={item.producto_id}
                  style={{
                    backgroundColor: item.es_bajo_stock ? '#fff8f8' : undefined
                  }}
                >
                  <td>
                    <strong>{item.nombre}</strong>
                    {item.es_comida && (
                      <span className="badge badge-preparacion" style={{ marginLeft: '6px' }}>
                        Cocina
                      </span>
                    )}
                  </td>
                  <td>{item.categoria_nombre}</td>
                  <td className="text-right">{formatCurrency(item.precio)}</td>
                  <td className="text-center" style={{ fontSize: '15px' }}>
                    <strong style={{ color: item.es_bajo_stock ? '#c62828' : '#111' }}>
                      {item.stock_actual}
                    </strong>
                  </td>
                  <td className="text-center">{item.stock_minimo}</td>
                  <td className="text-center">
                    {item.es_bajo_stock ? (
                      <span className="badge badge-low-stock">Stock Bajo</span>
                    ) : (
                      <span className="badge badge-ok-stock">Normal</span>
                    )}
                  </td>
                  <td className="text-center">
                    <button onClick={() => abrirAjuste(item)} className="btn btn-sm">
                      Ajuste Manual
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajuste Manual de Stock */}
      {itemAjustando && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Ajuste Manual de Inventario</h3>
              <button onClick={() => setItemAjustando(null)} className="btn btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarAjuste}>
              <p style={{ marginBottom: '12px' }}>
                Producto: <strong>{itemAjustando.nombre}</strong> ({activeLocal?.nombre})
              </p>

              <div className="form-group">
                <label>Stock Físico Actual en Sistema: {itemAjustando.stock_actual} unidades</label>
              </div>

              <div className="form-group">
                <label>Nuevo Stock Total *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={nuevoStockInput}
                  onChange={(e) => setNuevoStockInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setItemAjustando(null)} className="btn">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar y Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

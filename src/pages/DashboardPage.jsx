import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardMetrics } from '../services/reportesService';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, isAdmin, activeLocalId, locales } = useAuth();

  // Si es admin, puede elegir ver todos o un local específico en el dashboard
  const [selectedLocalFilter, setSelectedLocalFilter] = useState(
    isAdmin ? 'todos' : activeLocalId
  );

  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const targetLocal = selectedLocalFilter === 'todos' ? null : selectedLocalFilter;
    const data = getDashboardMetrics(targetLocal);
    setMetrics(data);
  }, [selectedLocalFilter, activeLocalId]);

  if (!metrics) {
    return <div className="app-container">Cargando métricas del panel...</div>;
  }

  return (
    <div className="app-container">
      <div className="page-title">
        <div>
          Dashboard General — Control y Métricas
          <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#555', marginLeft: '10px' }}>
            {selectedLocalFilter === 'todos'
              ? 'Consolidado de Ambos Locales'
              : locales.find((l) => l.id === selectedLocalFilter)?.nombre}
          </span>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px' }}>Filtrar vista por local:</label>
            <select
              value={selectedLocalFilter}
              onChange={(e) => setSelectedLocalFilter(e.target.value)}
              style={{ width: 'auto', fontWeight: 'bold' }}
            >
              <option value="todos">Ambos Locales (Consolidado)</option>
              {locales.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tarjetas de Métricas del Día */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="card-metric">
          <div className="metric-title">Ventas Hoy</div>
          <div className="metric-value">{formatCurrency(metrics.totalVentasHoy)}</div>
          <div className="metric-sub">{metrics.cantidadPedidosHoy} pedidos cobrados hoy</div>
        </div>

        <div className="card-metric">
          <div className="metric-title">Ticket Promedio</div>
          <div className="metric-value">{formatCurrency(metrics.ticketPromedioHoy)}</div>
          <div className="metric-sub">Calculado sobre ventas del día</div>
        </div>

        <div className="card-metric">
          <div className="metric-title">Stock en Alerta</div>
          <div
            className="metric-value"
            style={{ color: metrics.productosBajoStock.length > 0 ? '#c62828' : '#2e7d32' }}
          >
            {metrics.productosBajoStock.length}
          </div>
          <div className="metric-sub">Productos en o bajo stock mínimo</div>
        </div>

        <div className="card-metric">
          <div className="metric-title">Total de Productos Top</div>
          <div className="metric-value">{metrics.topProductos.length}</div>
          <div className="metric-sub">Productos con rotación activa</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Tabla Ventas Últimos 7 Días */}
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>
            Ventas de los Últimos 7 Días
          </h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha / Día</th>
                  <th className="text-center">Cant. Pedidos</th>
                  <th className="text-right">Total Facturado</th>
                </tr>
              </thead>
              <tbody>
                {metrics.ultimos7Dias.map((dia, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{dia.diaNombre}</strong>{' '}
                      <span style={{ fontSize: '11px', color: '#666' }}>({dia.fecha})</span>
                    </td>
                    <td className="text-center">{dia.cantidadPedidos}</td>
                    <td className="text-right">
                      <strong>{formatCurrency(dia.totalFacturado)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Top Productos Más Vendidos */}
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>
            Top 5 Productos Más Vendidos
          </h3>
          {metrics.topProductos.length === 0 ? (
            <p style={{ color: '#666' }}>No hay ventas registradas aún para este filtro.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Ranking / Producto</th>
                    <th className="text-center">Unidades</th>
                    <th className="text-right">Total Generado</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topProductos.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>#{idx + 1}</strong> {p.nombre}{' '}
                        {p.es_combo && <span className="badge badge-preparacion">Combo</span>}
                      </td>
                      <td className="text-center">{p.cantidad_total}</td>
                      <td className="text-right">{formatCurrency(p.monto_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tabla Productos con Stock Bajo */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '15px', color: '#c62828' }}>
            Alerta: Productos con Stock Bajo o Crítico
          </h3>
          <Link to="/stock" className="btn btn-sm">
            Ir a Gestión de Stock →
          </Link>
        </div>

        {metrics.productosBajoStock.length === 0 ? (
          <div className="alert alert-success">
            ✓ Todos los productos se encuentran en niveles normales de inventario.
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Local</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-center">Stock Actual</th>
                  <th className="text-center">Stock Mínimo</th>
                  <th className="text-center">Estado</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {metrics.productosBajoStock.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.local_nombre}</strong></td>
                    <td>{item.nombre}</td>
                    <td>{item.categoria_nombre}</td>
                    <td className="text-center" style={{ color: '#c62828', fontWeight: 'bold' }}>
                      {item.stock_actual}
                    </td>
                    <td className="text-center">{item.stock_minimo}</td>
                    <td className="text-center">
                      <span className="badge badge-low-stock">Bajo Stock</span>
                    </td>
                    <td className="text-right">
                      <Link to="/stock" className="btn btn-sm">
                        Ajustar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

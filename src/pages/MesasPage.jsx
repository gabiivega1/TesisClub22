import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMesas, abrirMesa, getCuentaMesa, liberarMesa } from '../services/mesasService';
import { procesarCobroVenta } from '../services/pedidosService';
import { getPromociones, calcularDescuento } from '../services/promocionesService';
import { formatCurrency, formatDate } from '../utils/formatters';
import AlertMessage from '../components/AlertMessage';
import ReceiptModal from '../components/ReceiptModal';

export default function MesasPage() {
  const { activeLocalId, activeLocal, user, isAdmin, locales, switchActiveLocal } = useAuth();
  const navigate = useNavigate();

  const [mesas, setMesas] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  // Mesa seleccionada para ver cuenta o cobrar
  const [mesaDetalle, setMesaDetalle] = useState(null);
  const [cuentaActiva, setCuentaActiva] = useState(null);

  // Estado para el modal de cobro de mesa
  const [mostrarCobroModal, setMostrarCobroModal] = useState(false);
  const [promociones, setPromociones] = useState([]);
  const [promocionId, setPromocionId] = useState('');
  const [medioPagoPrincipal, setMedioPagoPrincipal] = useState('efectivo');
  const [esPagoMixto, setEsPagoMixto] = useState(false);
  const [montoPago1, setMontoPago1] = useState('');
  const [medioPago2, setMedioPago2] = useState('mercadopago');
  const [montoPago2, setMontoPago2] = useState('');

  // Ticket emitido al cobrar mesa
  const [ticketEmitido, setTicketEmitido] = useState(null);

  const cargarMesas = () => {
    const list = getMesas(activeLocalId);
    setMesas(list);
  };

  useEffect(() => {
    cargarMesas();
    setMesaDetalle(null);
    setCuentaActiva(null);
    setPromociones(getPromociones(true));
  }, [activeLocalId]);

  const handleSeleccionarMesa = (mesa) => {
    setMesaDetalle(mesa);
    if (mesa.estado === 'ocupada') {
      const cuenta = getCuentaMesa(mesa.id);
      setCuentaActiva(cuenta);
    } else {
      setCuentaActiva(null);
    }
  };

  const handleAbrirMesa = (mesaId) => {
    try {
      abrirMesa(mesaId, user?.id || 'usr_admin');
      setMensaje({ type: 'success', text: 'Mesa abierta exitosamente. Puede cargar consumos.' });
      cargarMesas();
      const cuenta = getCuentaMesa(mesaId);
      setCuentaActiva(cuenta);
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message || 'Error al abrir mesa.' });
    }
  };

  const handleIrAPosParaMesa = (mesaId) => {
    navigate(`/pos?mesaId=${mesaId}`);
  };

  const handleLiberarMesaSinCobro = (mesaId) => {
    if (window.confirm('¿Desea liberar la mesa sin cobrar?')) {
      liberarMesa(mesaId);
      setMensaje({ type: 'info', text: 'Mesa liberada.' });
      setMesaDetalle(null);
      setCuentaActiva(null);
      cargarMesas();
    }
  };

  const abrirModalCobro = () => {
    if (!cuentaActiva || !cuentaActiva.items || cuentaActiva.items.length === 0) {
      setMensaje({ type: 'warning', text: 'La mesa no posee consumos cargados para cobrar.' });
      return;
    }
    setPromocionId('');
    setEsPagoMixto(false);
    setMontoPago1('');
    setMontoPago2('');
    setMostrarCobroModal(true);
  };

  // Cálculos de la cuenta al cobrar
  const subtotalCuenta = cuentaActiva?.items?.reduce((acc, it) => acc + (it.subtotal || 0), 0) || 0;
  const promoSeleccionada = promociones.find((p) => p.id === promocionId) || null;
  const descuentoCuenta = promoSeleccionada
    ? calcularDescuento(promoSeleccionada, subtotalCuenta, medioPagoPrincipal)
    : 0;
  const totalCuenta = Math.max(0, subtotalCuenta - descuentoCuenta);

  const handleConfirmarCobroMesa = (e) => {
    e.preventDefault();
    setMensaje(null);

    // Preparar pagos
    const listaPagos = [];
    if (esPagoMixto) {
      const p1 = Number(montoPago1) || 0;
      const p2 = Number(montoPago2) || 0;
      if (Math.abs(p1 + p2 - totalCuenta) > 1) {
        setMensaje({
          type: 'danger',
          text: `La suma de pagos mixtos (${formatCurrency(p1 + p2)}) debe coincidir con el total (${formatCurrency(totalCuenta)}).`
        });
        return;
      }
      listaPagos.push({ medio_pago: medioPagoPrincipal, monto: p1 });
      listaPagos.push({ medio_pago: medioPago2, monto: p2 });
    } else {
      listaPagos.push({ medio_pago: medioPagoPrincipal, monto: totalCuenta });
    }

    try {
      const resultado = procesarCobroVenta({
        pedidoId: cuentaActiva.pedido?.id,
        localId: activeLocalId,
        tipo: 'mesa',
        mesaId: mesaDetalle.id,
        numeroMesa: mesaDetalle.numero,
        items: cuentaActiva.items,
        subtotal: subtotalCuenta,
        descuento: descuentoCuenta,
        total: totalCuenta,
        promocionId: promoSeleccionada ? promoSeleccionada.id : null,
        usuarioId: user?.id || 'usr_admin',
        notas: `Cierre de Mesa #${mesaDetalle.numero}`,
        pagos: listaPagos
      });

      setTicketEmitido(resultado);
      setMostrarCobroModal(false);
      setMesaDetalle(null);
      setCuentaActiva(null);
      setMensaje({ type: 'success', text: `¡Mesa #${mesaDetalle.numero} cobrada y liberada con éxito!` });
      cargarMesas();
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message || 'Error al cobrar mesa.' });
    }
  };

  return (
    <div className="app-container">
      <div className="page-title">
        <div>
          Control de Mesas y Cuentas Abiertas — <strong>{activeLocal?.nombre}</strong>
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

      <div className="grid-2">
        {/* GRILLA DE MESAS */}
        <div>
          <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>
            Grilla de Salón (8 Mesas)
          </h3>
          <div className="mesas-grid">
            {mesas.map((mesa) => (
              <div
                key={mesa.id}
                onClick={() => handleSeleccionarMesa(mesa)}
                className={`mesa-box ${mesa.estado}`}
                style={{
                  borderWidth: mesaDetalle?.id === mesa.id ? '3px' : '2px',
                  borderColor: mesaDetalle?.id === mesa.id ? '#111' : undefined
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Mesa {mesa.numero}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>Cap: {mesa.capacidad} pers.</div>
                <div style={{ margin: '6px 0' }}>
                  <span className={`badge badge-${mesa.estado}`}>{mesa.estado}</span>
                </div>
                {mesa.estado === 'ocupada' && (
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111' }}>
                    {formatCurrency(mesa.total_acumulado)}
                    <div style={{ fontSize: '10px', color: '#555' }}>
                      ({mesa.cantidad_items} items)
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '14px', fontSize: '12px', color: '#555', display: 'flex', gap: '16px' }}>
            <span><strong style={{ color: '#1b5e20' }}>■ Libre:</strong> Disponible para clientes</span>
            <span><strong style={{ color: '#e65100' }}>■ Ocupada:</strong> Con cuenta y consumos</span>
            <span><strong style={{ color: '#0d47a1' }}>■ Reservada:</strong> Pendiente de llegada</span>
          </div>
        </div>

        {/* DETALLE DE MESA SELECCIONADA */}
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '12px', borderBottom: '1px solid #ccc', paddingBottom: '6px' }}>
            {mesaDetalle ? `Detalle: Mesa #${mesaDetalle.numero}` : 'Seleccione una mesa de la grilla'}
          </h3>

          {!mesaDetalle ? (
            <p style={{ color: '#777', padding: '20px 0' }}>
              Haga clic sobre cualquier mesa del salón para consultar su estado, abrir cuenta, agregar consumos o cerrarla.
            </p>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <strong>Estado Actual:</strong>{' '}
                  <span className={`badge badge-${mesaDetalle.estado}`}>{mesaDetalle.estado}</span>
                </div>
                <div>
                  <strong>Capacidad:</strong> {mesaDetalle.capacidad} comensales
                </div>
              </div>

              {mesaDetalle.estado === 'libre' && (
                <div style={{ padding: '16px', backgroundColor: '#f9f9f9', border: '1px dashed #ccc', textAlign: 'center' }}>
                  <p style={{ marginBottom: '12px' }}>La mesa está vacía y disponible.</p>
                  <button
                    onClick={() => handleAbrirMesa(mesaDetalle.id)}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px' }}
                  >
                    + Abrir Cuenta y Ocupar Mesa
                  </button>
                </div>
              )}

              {mesaDetalle.estado === 'reservada' && (
                <div style={{ padding: '16px', backgroundColor: '#f0f7ff', border: '1px solid #90caf9' }}>
                  <p style={{ marginBottom: '12px' }}>
                    Esta mesa posee una reserva activa. Puede sentar a los comensales o liberarla.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleAbrirMesa(mesaDetalle.id)}
                      className="btn btn-primary"
                    >
                      Ocupar Mesa (Iniciar Consumos)
                    </button>
                    <button
                      onClick={() => handleLiberarMesaSinCobro(mesaDetalle.id)}
                      className="btn"
                    >
                      Liberar Reserva
                    </button>
                  </div>
                </div>
              )}

              {mesaDetalle.estado === 'ocupada' && cuentaActiva && (
                <div>
                  <h4 style={{ fontSize: '13px', margin: '10px 0 6px' }}>Consumos Acumulados:</h4>
                  <div className="table-responsive" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th className="text-center">Cant</th>
                          <th className="text-right">Unitario</th>
                          <th className="text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!cuentaActiva.items || cuentaActiva.items.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center" style={{ color: '#888' }}>
                              Cuenta abierta sin consumos cargados aún.
                            </td>
                          </tr>
                        ) : (
                          cuentaActiva.items.map((it) => (
                            <tr key={it.id}>
                              <td>
                                {it.nombre_item}
                                {it.notas && (
                                  <div style={{ fontSize: '11px', color: '#555' }}>({it.notas})</div>
                                )}
                              </td>
                              <td className="text-center">{it.cantidad}</td>
                              <td className="text-right">{formatCurrency(it.precio_unitario)}</td>
                              <td className="text-right">
                                <strong>{formatCurrency(it.subtotal)}</strong>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ backgroundColor: '#f5f5f5', padding: '10px', marginTop: '10px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
                      <span>Total Acumulado:</span>
                      <span>{formatCurrency(subtotalCuenta)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleIrAPosParaMesa(mesaDetalle.id)}
                      className="btn"
                      style={{ flex: 1 }}
                    >
                      + Cargar Nuevos Consumos
                    </button>
                    <button
                      onClick={abrirModalCobro}
                      disabled={!cuentaActiva.items || cuentaActiva.items.length === 0}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      Cerrar y Cobrar Cuenta
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE COBRO Y CIERRE DE MESA */}
      {mostrarCobroModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Cerrar y Cobrar Mesa #{mesaDetalle?.numero}</h3>
              <button onClick={() => setMostrarCobroModal(false)} className="btn btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarCobroMesa}>
              <div style={{ marginBottom: '12px' }}>
                <p>Local: <strong>{activeLocal?.nombre}</strong></p>
                <p>Items a facturar: <strong>{cuentaActiva?.items?.length} items</strong></p>
              </div>

              {/* Promoción */}
              <div className="form-group">
                <label>Aplicar Promoción al Cierre:</label>
                <select
                  value={promocionId}
                  onChange={(e) => setPromocionId(e.target.value)}
                >
                  <option value="">Sin promoción</option>
                  {promociones.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.medio_pago_condicion ? `(${p.medio_pago_condicion})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Totales */}
              <div style={{ border: '1px solid #ccc', padding: '10px', margin: '12px 0', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotalCuenta)}</span>
                </div>
                {descuentoCuenta > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c62828', fontWeight: 'bold' }}>
                    <span>Descuento aplicado:</span>
                    <span>-{formatCurrency(descuentoCuenta)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 'bold', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #222' }}>
                  <span>Total Final:</span>
                  <span>{formatCurrency(totalCuenta)}</span>
                </div>
              </div>

              {/* Medios de Pago */}
              <div className="form-group">
                <label>Medio de Pago Principal:</label>
                <select
                  value={medioPagoPrincipal}
                  onChange={(e) => setMedioPagoPrincipal(e.target.value)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="debito">Tarjeta de Débito</option>
                  <option value="credito">Tarjeta de Crédito</option>
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={esPagoMixto}
                    onChange={(e) => {
                      setEsPagoMixto(e.target.checked);
                      if (e.target.checked && totalCuenta > 0) {
                        const m = Math.round(totalCuenta / 2);
                        setMontoPago1(String(m));
                        setMontoPago2(String(totalCuenta - m));
                      }
                    }}
                  />
                  <span>Pago Mixto (Dividir monto)</span>
                </label>
              </div>

              {esPagoMixto && (
                <div className="card" style={{ padding: '8px', marginBottom: '10px', backgroundColor: '#f7f7f7' }}>
                  <div className="grid-2">
                    <div>
                      <label style={{ fontSize: '11px' }}>Monto {medioPagoPrincipal}:</label>
                      <input
                        type="number"
                        value={montoPago1}
                        onChange={(e) => setMontoPago1(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px' }}>Segundo Medio:</label>
                      <select
                        value={medioPago2}
                        onChange={(e) => setMedioPago2(e.target.value)}
                      >
                        <option value="mercadopago">Mercado Pago</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="debito">Débito</option>
                        <option value="credito">Crédito</option>
                        <option value="efectivo">Efectivo</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Monto segundo pago"
                        value={montoPago2}
                        onChange={(e) => setMontoPago2(e.target.value)}
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setMostrarCobroModal(false)} className="btn">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Cobrar {formatCurrency(totalCuenta)} y Liberar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket emitido */}
      {ticketEmitido && (
        <ReceiptModal
          receiptData={ticketEmitido}
          onClose={() => setTicketEmitido(null)}
        />
      )}
    </div>
  );
}

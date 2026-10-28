import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProductos } from '../services/productosService';
import { getCombos } from '../services/combosService';
import { getPromociones, calcularDescuento } from '../services/promocionesService';
import { getMesas } from '../services/mesasService';
import { procesarCobroVenta } from '../services/pedidosService';
import { formatCurrency } from '../utils/formatters';
import AlertMessage from '../components/AlertMessage';
import ReceiptModal from '../components/ReceiptModal';

export default function PuntoDeVentaPage() {
  const { activeLocalId, activeLocal, user } = useAuth();
  const location = useLocation();

  // Catálogos disponibles
  const [productos, setProductos] = useState([]);
  const [combos, setCombos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [mesas, setMesas] = useState([]);

  // Estado del Carrito / Pedido en curso
  const [tipoPedido, setTipoPedido] = useState('llevar'); // 'llevar' o 'mesa'
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [promocionId, setPromocionId] = useState('');
  const [notasPedido, setNotasPedido] = useState('');

  // Medios de pago y cobro
  const [medioPagoPrincipal, setMedioPagoPrincipal] = useState('efectivo');
  const [esPagoMixto, setEsPagoMixto] = useState(false);
  const [montoPago1, setMontoPago1] = useState('');
  const [medioPago2, setMedioPago2] = useState('mercadopago');
  const [montoPago2, setMontoPago2] = useState('');

  // Filtros de búsqueda en catálogo
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');

  // Notificaciones y Ticket
  const [alerta, setAlerta] = useState(null);
  const [ticketEmitido, setTicketEmitido] = useState(null);

  const cargarDatos = () => {
    const prods = getProductos(activeLocalId, true);
    const cmbs = getCombos(activeLocalId);
    const prms = getPromociones(true);
    const ms = getMesas(activeLocalId);

    setProductos(prods);
    setCombos(cmbs);
    setPromociones(prms);
    setMesas(ms);
  };

  useEffect(() => {
    cargarDatos();
    setCartItems([]);
    setPromocionId('');
    setAlerta(null);

    // Revisar si viene preseleccionada una mesa por query params
    const params = new URLSearchParams(location.search);
    const paramMesaId = params.get('mesaId');
    if (paramMesaId) {
      setTipoPedido('mesa');
      setMesaSeleccionadaId(paramMesaId);
    }
  }, [activeLocalId, location.search]);

  // Agregar producto simple al carrito
  const handleAddProducto = (prod) => {
    if (prod.stock_actual <= 0) {
      setAlerta({ type: 'danger', text: `Stock insuficiente para ${prod.nombre} (Stock actual: 0).` });
      return;
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => !item.es_combo && item.producto_id === prod.id);
      if (existingIndex !== -1) {
        const itemActual = prev[existingIndex];
        if (itemActual.cantidad + 1 > prod.stock_actual) {
          setAlerta({
            type: 'warning',
            text: `No hay más stock disponible para ${prod.nombre} (Máximo: ${prod.stock_actual}).`
          });
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...itemActual,
          cantidad: itemActual.cantidad + 1,
          subtotal: (itemActual.cantidad + 1) * itemActual.precio
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `cart_${Date.now()}_${Math.random()}`,
            producto_id: prod.id,
            combo_id: null,
            es_combo: false,
            nombre: prod.nombre,
            precio: prod.precio,
            cantidad: 1,
            subtotal: prod.precio,
            notas: '',
            es_comida: prod.es_comida,
            stock_maximo: prod.stock_actual
          }
        ];
      }
    });
  };

  // Agregar combo al carrito
  const handleAddCombo = (combo) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.es_combo && item.combo_id === combo.id);
      if (existingIndex !== -1) {
        const itemActual = prev[existingIndex];
        const updated = [...prev];
        updated[existingIndex] = {
          ...itemActual,
          cantidad: itemActual.cantidad + 1,
          subtotal: (itemActual.cantidad + 1) * itemActual.precio
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `cart_cmb_${Date.now()}_${Math.random()}`,
            producto_id: null,
            combo_id: combo.id,
            es_combo: true,
            nombre: combo.nombre,
            precio: combo.precio_venta,
            cantidad: 1,
            subtotal: combo.precio_venta,
            notas: '',
            es_comida: combo.items?.some((ci) => ci.es_comida) || false,
            stock_maximo: 99
          }
        ];
      }
    });
  };

  // Modificar cantidad en carrito
  const handleChangeCantidad = (itemId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const nuevaCantidad = item.cantidad + delta;
            if (nuevaCantidad <= 0) return null;
            if (!item.es_combo && nuevaCantidad > item.stock_maximo) {
              setAlerta({
                type: 'warning',
                text: `Solo hay ${item.stock_maximo} unidades en stock de ${item.nombre}.`
              });
              return item;
            }
            return {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.precio
            };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Cambiar notas particulares por ítem
  const handleChangeNotasItem = (itemId, texto) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, notas: texto } : item))
    );
  };

  // Eliminar ítem del carrito
  const handleRemoveItem = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Cálculos de totales en tiempo real
  const subtotal = cartItems.reduce((acc, it) => acc + it.subtotal, 0);

  const promocionSeleccionada = promociones.find((p) => p.id === promocionId) || null;
  const descuento = promocionSeleccionada
    ? calcularDescuento(promocionSeleccionada, subtotal, medioPagoPrincipal)
    : 0;

  const totalFinal = Math.max(0, subtotal - descuento);

  // Procesar cobro y confirmar venta
  const handleConfirmarVenta = (e) => {
    e.preventDefault();
    setAlerta(null);

    if (cartItems.length === 0) {
      setAlerta({ type: 'danger', text: 'El carrito está vacío. Agregue productos para vender.' });
      return;
    }

    if (tipoPedido === 'mesa' && !mesaSeleccionadaId) {
      setAlerta({ type: 'danger', text: 'Debe seleccionar un número de mesa para pedidos en mesa.' });
      return;
    }

    // Preparar estructura de pagos
    const listaPagos = [];
    if (esPagoMixto) {
      const p1 = Number(montoPago1) || 0;
      const p2 = Number(montoPago2) || 0;
      if (Math.abs(p1 + p2 - totalFinal) > 1) {
        setAlerta({
          type: 'danger',
          text: `La suma de los pagos mixtos (${formatCurrency(p1 + p2)}) debe coincidir exactamente con el total (${formatCurrency(totalFinal)}).`
        });
        return;
      }
      listaPagos.push({ medio_pago: medioPagoPrincipal, monto: p1 });
      listaPagos.push({ medio_pago: medioPago2, monto: p2 });
    } else {
      listaPagos.push({ medio_pago: medioPagoPrincipal, monto: totalFinal });
    }

    try {
      const mesaObj = mesas.find((m) => m.id === mesaSeleccionadaId);
      const resultado = procesarCobroVenta({
        pedidoId: null,
        localId: activeLocalId,
        tipo: tipoPedido,
        mesaId: tipoPedido === 'mesa' ? mesaSeleccionadaId : null,
        numeroMesa: mesaObj ? mesaObj.numero : null,
        items: cartItems,
        subtotal,
        descuento,
        total: totalFinal,
        promocionId: promocionSeleccionada ? promocionSeleccionada.id : null,
        usuarioId: user?.id || 'usr_admin',
        notas: notasPedido,
        pagos: listaPagos
      });

      // Venta exitosa: mostrar ticket y limpiar carrito
      setTicketEmitido(resultado);
      setCartItems([]);
      setPromocionId('');
      setNotasPedido('');
      setEsPagoMixto(false);
      setMontoPago1('');
      setMontoPago2('');
      setAlerta({ type: 'success', text: '¡Venta registrada y cobrada exitosamente! Stock actualizado.' });
      cargarDatos(); // Actualizar catálogo de stock
    } catch (err) {
      setAlerta({ type: 'danger', text: err.message || 'Error al procesar la venta.' });
    }
  };

  // Filtrar catálogo por texto y categoría
  const productosFiltrados = productos.filter((p) => {
    const matchTexto = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCat =
      categoriaSeleccionada === 'todos'
        ? true
        : categoriaSeleccionada === 'combos'
        ? false
        : p.categoria_id === categoriaSeleccionada;
    return matchTexto && matchCat;
  });

  const combosFiltrados =
    categoriaSeleccionada === 'todos' || categoriaSeleccionada === 'combos'
      ? combos.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      : [];

  return (
    <div className="app-container">
      <div className="page-title">
        <div>
          Punto de Venta (POS) — <strong>{activeLocal?.nombre}</strong>
        </div>
        <span style={{ fontSize: '13px', color: '#555' }}>
          Moneda: <strong>ARS</strong> | Cobro Inmediato
        </span>
      </div>

      <AlertMessage
        type={alerta?.type}
        message={alerta?.text}
        onClose={() => setAlerta(null)}
      />

      <div className="pos-container">
        {/* PANEL IZQUIERDO: CATÁLOGO Y COMBOS */}
        <div>
          <div className="card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Buscar por nombre (ej: Malbec, IPA, Fernet, Pizza...)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ flex: 1, minWidth: '180px' }}
              />
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="todos">Todos los productos y combos</option>
                <option value="combos">Solo Combos Promocionales</option>
                <option value="cat_vinos">Vinos y Espumantes</option>
                <option value="cat_cervezas">Cervezas</option>
                <option value="cat_tragos">Tragos y Coctelería</option>
                <option value="cat_sin_alcohol">Sin Alcohol</option>
                {activeLocalId === 'loc_gpaz' && (
                  <option value="cat_comidas">Cocina y Comidas</option>
                )}
              </select>
            </div>
          </div>

          {/* COMBOS PROMOCIONALES */}
          {combosFiltrados.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '8px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                Combos Destacados
              </h4>
              <div className="grid-2">
                {combosFiltrados.map((combo) => (
                  <div
                    key={combo.id}
                    className="card"
                    style={{ margin: 0, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong>{combo.nombre}</strong>
                        <span className="badge badge-preparacion">Combo</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#555', margin: '4px 0' }}>
                        {combo.descripcion}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <strong style={{ fontSize: '15px' }}>{formatCurrency(combo.precio_venta)}</strong>
                      <button onClick={() => handleAddCombo(combo)} className="btn btn-sm btn-primary">
                        + Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCTOS INDIVIDUALES */}
          <div>
            <h4 style={{ fontSize: '14px', marginBottom: '8px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
              Catálogo de Productos
            </h4>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="text-right">Precio</th>
                    <th className="text-center">Stock</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ color: '#888', padding: '16px' }}>
                        No hay productos disponibles para este filtro en {activeLocal?.nombre}.
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.nombre}</strong>
                          {p.es_comida && (
                            <span className="badge badge-ocupada" style={{ marginLeft: '4px' }}>
                              Cocina
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '12px' }}>{p.categoria_nombre}</td>
                        <td className="text-right">
                          <strong>{formatCurrency(p.precio)}</strong>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge ${p.stock_actual <= p.stock_minimo ? 'badge-low-stock' : 'badge-ok-stock'}`}
                          >
                            {p.stock_actual} disp.
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => handleAddProducto(p)}
                            disabled={p.stock_actual <= 0}
                            className="btn btn-sm"
                          >
                            + Agregar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: TICKET Y COBRO */}
        <div className="pos-cart-panel">
          <h3 style={{ fontSize: '16px', marginBottom: '10px', borderBottom: '1px solid #222', paddingBottom: '6px' }}>
            Orden Actual de Venta
          </h3>

          {/* Modalidad: En Mesa vs Para Llevar */}
          <div className="grid-2" style={{ marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Modalidad:</label>
              <select
                value={tipoPedido}
                onChange={(e) => setTipoPedido(e.target.value)}
              >
                <option value="llevar">Para Llevar (Mostrador)</option>
                <option value="mesa">Consumo en Mesa</option>
              </select>
            </div>

            {tipoPedido === 'mesa' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Número de Mesa *:</label>
                <select
                  value={mesaSeleccionadaId}
                  onChange={(e) => setMesaSeleccionadaId(e.target.value)}
                  required
                >
                  <option value="">Seleccione mesa...</option>
                  {mesas.map((m) => (
                    <option key={m.id} value={m.id}>
                      Mesa #{m.numero} ({m.estado})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Lista de Items en Carrito */}
          <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '12px', border: '1px solid #ccc' }}>
            {cartItems.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#777', fontSize: '13px' }}>
                El pedido no tiene items todavía. Haga clic en "+ Agregar" en los productos o combos.
              </p>
            ) : (
              <table style={{ margin: 0, border: 'none' }}>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px' }}>
                        <strong>{item.nombre}</strong>
                        {item.es_combo && (
                          <span className="badge badge-preparacion" style={{ marginLeft: '4px' }}>
                            Combo
                          </span>
                        )}
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {formatCurrency(item.precio)} c/u
                        </div>
                        <input
                          type="text"
                          placeholder="Nota (ej: sin hielo, bien dorada)..."
                          value={item.notas}
                          onChange={(e) => handleChangeNotasItem(item.id, e.target.value)}
                          style={{ fontSize: '11px', padding: '3px 5px', marginTop: '3px' }}
                        />
                      </td>

                      <td style={{ width: '90px', textAlign: 'center', padding: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleChangeCantidad(item.id, -1)}
                            className="btn btn-sm"
                            style={{ padding: '1px 6px' }}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 'bold' }}>{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => handleChangeCantidad(item.id, 1)}
                            className="btn btn-sm"
                            style={{ padding: '1px 6px' }}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right', padding: '6px', width: '85px' }}>
                        <strong>{formatCurrency(item.subtotal)}</strong>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            style={{ background: 'none', border: 'none', color: '#c62828', fontSize: '11px', cursor: 'pointer' }}
                          >
                            Quitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Promociones y Descuentos */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Aplicar Promoción al Cierre:</label>
            <select
              value={promocionId}
              onChange={(e) => setPromocionId(e.target.value)}
            >
              <option value="">Sin promoción aplicada</option>
              {promociones.map((prm) => (
                <option key={prm.id} value={prm.id}>
                  {prm.nombre} {prm.medio_pago_condicion ? `(Válido en ${prm.medio_pago_condicion})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Resumen de Montos en Tiempo Real */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #ccc', padding: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {descuento > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#c62828', fontWeight: 'bold' }}>
                <span>Descuento ({promocionSeleccionada?.nombre}):</span>
                <span>-{formatCurrency(descuento)}</span>
              </div>
            )}

            <div className="pos-total-row">
              <span>TOTAL A COBRAR:</span>
              <span style={{ fontSize: '18px' }}>{formatCurrency(totalFinal)}</span>
            </div>
          </div>

          {/* Formulario de Cobro y Medios de Pago */}
          <form onSubmit={handleConfirmarVenta}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Medio de Pago Principal:</label>
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

            {/* Checkbox Pago Mixto */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={esPagoMixto}
                  onChange={(e) => {
                    setEsPagoMixto(e.target.checked);
                    if (e.target.checked && totalFinal > 0) {
                      const mitad = Math.round(totalFinal / 2);
                      setMontoPago1(String(mitad));
                      setMontoPago2(String(totalFinal - mitad));
                    }
                  }}
                />
                <span>Habilitar Pago Mixto (dividir monto en 2 medios de pago)</span>
              </label>
            </div>

            {esPagoMixto && (
              <div className="card" style={{ padding: '8px', marginBottom: '10px', backgroundColor: '#fafafa' }}>
                <div className="grid-2">
                  <div>
                    <label style={{ fontSize: '11px' }}>Monto {medioPagoPrincipal} ($):</label>
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

            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Notas generales de la venta (opcional)..."
                value={notasPedido}
                onChange={(e) => setNotasPedido(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={cartItems.length === 0}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            >
              Confirmar Venta y Cobrar ({formatCurrency(totalFinal)})
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Comprobante / Ticket */}
      {ticketEmitido && (
        <ReceiptModal
          receiptData={ticketEmitido}
          onClose={() => setTicketEmitido(null)}
        />
      )}
    </div>
  );
}

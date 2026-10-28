import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCombos, crearCombo, actualizarCombo, eliminarCombo } from '../services/combosService';
import { getPromociones, crearPromocion, actualizarPromocion, eliminarPromocion } from '../services/promocionesService';
import { getProductos } from '../services/productosService';
import { formatCurrency } from '../utils/formatters';
import AlertMessage from '../components/AlertMessage';

export default function CombosPromocionesPage() {
  const { locales, activeLocalId } = useAuth();
  const [tabActiva, setTabActiva] = useState('combos'); // 'combos' o 'promos'
  const [combos, setCombos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  // Modal para Combo
  const [modalCombo, setModalCombo] = useState(false);
  const [comboEditando, setComboEditando] = useState(null);
  const [comboForm, setComboForm] = useState({
    nombre: '',
    descripcion: '',
    precio_venta: '',
    local_id: '',
    items: [] // array de { producto_id, cantidad }
  });

  // Modal para Promoción
  const [modalPromo, setModalPromo] = useState(false);
  const [promoEditando, setPromoEditando] = useState(null);
  const [promoForm, setPromoForm] = useState({
    nombre: '',
    tipo: 'general',
    medio_pago_condicion: '',
    descuento_porcentaje: '10',
    descuento_fijo: '0',
    monto_minimo: '0'
  });

  const cargarDatos = () => {
    setCombos(getCombos(null)); // ver todos
    setPromociones(getPromociones(false));
    setProductosCatalogo(getProductos(null, true));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Manejo de items en el formulario de Combo
  const handleAgregarItemCombo = () => {
    if (productosCatalogo.length === 0) return;
    setComboForm((prev) => ({
      ...prev,
      items: [...prev.items, { producto_id: productosCatalogo[0].id, cantidad: 1 }]
    }));
  };

  const handleCambiarItemCombo = (index, campo, valor) => {
    setComboForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [campo]: valor };
      return { ...prev, items: updated };
    });
  };

  const handleQuitarItemCombo = (index) => {
    setComboForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const abrirNuevoCombo = () => {
    setComboEditando(null);
    setComboForm({
      nombre: '',
      descripcion: '',
      precio_venta: '20000',
      local_id: '',
      items: productosCatalogo.length > 0 ? [{ producto_id: productosCatalogo[0].id, cantidad: 1 }] : []
    });
    setModalCombo(true);
  };

  const abrirEditarCombo = (cmb) => {
    setComboEditando(cmb);
    setComboForm({
      nombre: cmb.nombre,
      descripcion: cmb.descripcion || '',
      precio_venta: String(cmb.precio_venta || ''),
      local_id: cmb.local_id || '',
      items: cmb.items?.map((it) => ({ producto_id: it.producto_id, cantidad: it.cantidad })) || []
    });
    setModalCombo(true);
  };

  const handleGuardarCombo = (e) => {
    e.preventDefault();
    if (!comboForm.nombre.trim()) {
      setMensaje({ type: 'danger', text: 'El nombre del combo es obligatorio.' });
      return;
    }
    if (comboForm.items.length === 0) {
      setMensaje({ type: 'danger', text: 'Debe agregar al menos un producto componente al combo.' });
      return;
    }

    try {
      const data = {
        nombre: comboForm.nombre,
        descripcion: comboForm.descripcion,
        precio_venta: Number(comboForm.precio_venta) || 0,
        local_id: comboForm.local_id || null
      };

      if (comboEditando) {
        actualizarCombo(comboEditando.id, data, comboForm.items);
        setMensaje({ type: 'success', text: `Combo "${data.nombre}" actualizado con éxito.` });
      } else {
        crearCombo(data, comboForm.items);
        setMensaje({ type: 'success', text: `Combo "${data.nombre}" creado exitosamente.` });
      }

      setModalCombo(false);
      cargarDatos();
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message || 'Error al guardar combo.' });
    }
  };

  const handleEliminarCombo = (id, nombre) => {
    if (window.confirm(`¿Desea dar de baja el combo "${nombre}"?`)) {
      eliminarCombo(id);
      setMensaje({ type: 'success', text: `Combo "${nombre}" desactivado.` });
      cargarDatos();
    }
  };

  // Manejo de Promociones
  const abrirNuevaPromo = () => {
    setPromoEditando(null);
    setPromoForm({
      nombre: '',
      tipo: 'general',
      medio_pago_condicion: '',
      descuento_porcentaje: '10',
      descuento_fijo: '0',
      monto_minimo: '0'
    });
    setModalPromo(true);
  };

  const abrirEditarPromo = (prm) => {
    setPromoEditando(prm);
    setPromoForm({
      nombre: prm.nombre,
      tipo: prm.tipo || 'general',
      medio_pago_condicion: prm.medio_pago_condicion || '',
      descuento_porcentaje: String(prm.descuento_porcentaje || 0),
      descuento_fijo: String(prm.descuento_fijo || 0),
      monto_minimo: String(prm.monto_minimo || 0)
    });
    setModalPromo(true);
  };

  const handleGuardarPromo = (e) => {
    e.preventDefault();
    if (!promoForm.nombre.trim()) {
      setMensaje({ type: 'danger', text: 'El nombre de la promoción es obligatorio.' });
      return;
    }

    try {
      const data = {
        nombre: promoForm.nombre,
        tipo: promoForm.tipo,
        medio_pago_condicion: promoForm.tipo === 'medio_pago' ? promoForm.medio_pago_condicion : null,
        descuento_porcentaje: Number(promoForm.descuento_porcentaje) || 0,
        descuento_fijo: Number(promoForm.descuento_fijo) || 0,
        monto_minimo: Number(promoForm.monto_minimo) || 0
      };

      if (promoEditando) {
        actualizarPromocion(promoEditando.id, data);
        setMensaje({ type: 'success', text: `Promoción "${data.nombre}" modificada.` });
      } else {
        crearPromocion(data);
        setMensaje({ type: 'success', text: `Promoción "${data.nombre}" creada.` });
      }

      setModalPromo(false);
      cargarDatos();
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message || 'Error al guardar promoción.' });
    }
  };

  const handleEliminarPromo = (id, nombre) => {
    if (window.confirm(`¿Desea dar de baja la promoción "${nombre}"?`)) {
      eliminarPromocion(id);
      setMensaje({ type: 'success', text: `Promoción "${nombre}" desactivada.` });
      cargarDatos();
    }
  };

  return (
    <div className="app-container">
      <div className="page-title">
        <div>Gestión de Combos y Promociones Comerciales</div>
        <div>
          {tabActiva === 'combos' ? (
            <button onClick={abrirNuevoCombo} className="btn btn-primary">
              + Nuevo Combo
            </button>
          ) : (
            <button onClick={abrirNuevaPromo} className="btn btn-primary">
              + Nueva Promoción
            </button>
          )}
        </div>
      </div>

      <AlertMessage
        type={mensaje?.type}
        message={mensaje?.text}
        onClose={() => setMensaje(null)}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setTabActiva('combos')}
          className={`btn ${tabActiva === 'combos' ? 'btn-primary' : ''}`}
        >
          Paquetes y Combos ({combos.filter((c) => c.activo !== false).length})
        </button>
        <button
          onClick={() => setTabActiva('promos')}
          className={`btn ${tabActiva === 'promos' ? 'btn-primary' : ''}`}
        >
          Promociones y Descuentos al Cierre ({promociones.filter((p) => p.activo !== false).length})
        </button>
      </div>

      {/* TAB 1: COMBOS */}
      {tabActiva === 'combos' && (
        <div className="card">
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
            Los combos se venden como un ítem único a precio cerrado y, al confirmarse la venta, el sistema descuenta automáticamente el stock individual de cada uno de sus componentes en el local.
          </p>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nombre del Combo</th>
                  <th>Descripción</th>
                  <th>Componentes (Stock a descontar)</th>
                  <th>Disponibilidad</th>
                  <th className="text-right">Precio de Venta</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {combos.filter((c) => c.activo !== false).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center" style={{ padding: '24px', color: '#666' }}>
                      No hay combos creados aún. Presione <strong>"+ Nuevo Combo"</strong> para crear paquetes promocionales (ej: Pizza + Birra, Fernetazo, etc.).
                    </td>
                  </tr>
                ) : (
                  combos.filter((c) => c.activo !== false).map((c) => {
                    const loc = locales.find((l) => l.id === c.local_id);
                    return (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.nombre}</strong>
                        </td>
                        <td style={{ fontSize: '12px', color: '#555' }}>{c.descripcion}</td>
                        <td>
                          <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px' }}>
                            {c.items && c.items.map((it, idx) => (
                              <li key={idx}>
                                <strong>{it.cantidad}x</strong> {it.producto_nombre}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>
                          {loc ? (
                            <span className="badge badge-ocupada">Solo {loc.nombre}</span>
                          ) : (
                            <span className="badge badge-ok-stock">Ambos Locales</span>
                          )}
                        </td>
                        <td className="text-right">
                          <strong>{formatCurrency(c.precio_venta)}</strong>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => abrirEditarCombo(c)}
                            className="btn btn-sm"
                            style={{ marginRight: '6px' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarCombo(c.id, c.nombre)}
                            className="btn btn-sm btn-danger-outline"
                          >
                            Baja
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROMOCIONES */}
      {tabActiva === 'promos' && (
        <div className="card">
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
            Las promociones se seleccionan durante el cobro en el POS o al cerrar una mesa, recalculando el total en tiempo real y detallando el descuento en el ticket.
          </p>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nombre Promoción</th>
                  <th>Tipo / Condición</th>
                  <th>Beneficio Otorgado</th>
                  <th>Requisito Mínimo</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {promociones.filter((p) => p.activo !== false).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center" style={{ padding: '24px', color: '#666' }}>
                      No hay promociones registradas aún. Presione <strong>"+ Nueva Promoción"</strong> para crear descuentos (ej: 10% Efectivo, Descuento compras +$20.000, etc.).
                    </td>
                  </tr>
                ) : (
                  promociones.filter((p) => p.activo !== false).map((prm) => (
                    <tr key={prm.id}>
                      <td><strong>{prm.nombre}</strong></td>
                      <td>
                        {prm.tipo === 'medio_pago' ? (
                          <span>Condicionada a medio: <strong>{prm.medio_pago_condicion}</strong></span>
                        ) : prm.tipo === 'monto_minimo' ? (
                          <span>Monto mínimo de compra</span>
                        ) : (
                          <span>Descuento General</span>
                        )}
                      </td>
                      <td>
                        {prm.descuento_porcentaje > 0 ? (
                          <strong style={{ color: '#1b5e20' }}>{prm.descuento_porcentaje}% de descuento</strong>
                        ) : (
                          <strong style={{ color: '#1b5e20' }}>{formatCurrency(prm.descuento_fijo)} de descuento fijo</strong>
                        )}
                      </td>
                      <td>
                        {prm.monto_minimo > 0 ? `Compra min. ${formatCurrency(prm.monto_minimo)}` : 'Sin mínimo'}
                      </td>
                      <td className="text-center">
                        <span className="badge badge-ok-stock">Activa</span>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => abrirEditarPromo(prm)}
                          className="btn btn-sm"
                          style={{ marginRight: '6px' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminarPromo(prm.id, prm.nombre)}
                          className="btn btn-sm btn-danger-outline"
                        >
                          Baja
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ALTA/EDICIÓN DE COMBO */}
      {modalCombo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{comboEditando ? 'Editar Combo' : 'Crear Nuevo Combo'}</h3>
              <button onClick={() => setModalCombo(false)} className="btn btn-sm">✕</button>
            </div>

            <form onSubmit={handleGuardarCombo}>
              <div className="form-group">
                <label>Nombre del Combo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Combo Fernetazo Familiar"
                  value={comboForm.nombre}
                  onChange={(e) => setComboForm({ ...comboForm, nombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Descripción comercial</label>
                <input
                  type="text"
                  placeholder="Ej: 1 Fernet Branca + 2 Coca-Cola 500ml"
                  value={comboForm.descripcion}
                  onChange={(e) => setComboForm({ ...comboForm, descripcion: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Precio Final de Venta (ARS) *</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={comboForm.precio_venta}
                    onChange={(e) => setComboForm({ ...comboForm, precio_venta: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Disponibilidad por Local</label>
                  <select
                    value={comboForm.local_id}
                    onChange={(e) => setComboForm({ ...comboForm, local_id: e.target.value })}
                  >
                    <option value="">Ambos Locales (Consolidado)</option>
                    {locales.map((l) => (
                      <option key={l.id} value={l.id}>
                        Solo {l.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <h4 style={{ fontSize: '13px', margin: '14px 0 8px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                Productos Componentes (Se descuentan del inventario)
              </h4>

              {productosCatalogo.length === 0 ? (
                <div className="alert alert-warning" style={{ fontSize: '13px', margin: '8px 0' }}>
                  Atención: No hay productos en el catálogo todavía. Para armar un combo, primero registre productos en la sección <strong>"Productos & Precios"</strong>.
                </div>
              ) : (
                <>
                  {comboForm.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <select
                        value={it.producto_id}
                        onChange={(e) => handleCambiarItemCombo(idx, 'producto_id', e.target.value)}
                        style={{ flex: 2 }}
                      >
                        {productosCatalogo.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.nombre} {prod.es_comida ? '(Cocina)' : ''}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        style={{ width: '80px' }}
                        value={it.cantidad}
                        onChange={(e) => handleCambiarItemCombo(idx, 'cantidad', e.target.value)}
                        title="Cantidad a descontar"
                      />

                      <button
                        type="button"
                        onClick={() => handleQuitarItemCombo(idx)}
                        className="btn btn-sm btn-danger-outline"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAgregarItemCombo}
                    className="btn btn-sm"
                    style={{ marginTop: '4px' }}
                  >
                    + Agregar otro componente
                  </button>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setModalCombo(false)} className="btn">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {comboEditando ? 'Guardar Cambios' : 'Crear Combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ALTA/EDICIÓN DE PROMOCIÓN */}
      {modalPromo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{promoEditando ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
              <button onClick={() => setModalPromo(false)} className="btn btn-sm">✕</button>
            </div>

            <form onSubmit={handleGuardarPromo}>
              <div className="form-group">
                <label>Nombre de la Promoción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 10% Descuento Pago Efectivo"
                  value={promoForm.nombre}
                  onChange={(e) => setPromoForm({ ...promoForm, nombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Promoción</label>
                <select
                  value={promoForm.tipo}
                  onChange={(e) => setPromoForm({ ...promoForm, tipo: e.target.value })}
                >
                  <option value="general">Descuento General Libre</option>
                  <option value="medio_pago">Condicionado a Medio de Pago</option>
                  <option value="monto_minimo">Condicionado a Monto Mínimo de Compra</option>
                </select>
              </div>

              {promoForm.tipo === 'medio_pago' && (
                <div className="form-group">
                  <label>Medio de Pago Requerido</label>
                  <select
                    value={promoForm.medio_pago_condicion}
                    onChange={(e) => setPromoForm({ ...promoForm, medio_pago_condicion: e.target.value })}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="debito">Tarjeta de Débito</option>
                    <option value="credito">Tarjeta de Crédito</option>
                  </select>
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label>Descuento Porcentual (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={promoForm.descuento_porcentaje}
                    onChange={(e) => setPromoForm({ ...promoForm, descuento_porcentaje: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>O Descuento Fijo en Pesos ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={promoForm.descuento_fijo}
                    onChange={(e) => setPromoForm({ ...promoForm, descuento_fijo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Monto Mínimo de Compra para aplicar ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0 = Sin mínimo"
                  value={promoForm.monto_minimo}
                  onChange={(e) => setPromoForm({ ...promoForm, monto_minimo: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setModalPromo(false)} className="btn">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {promoEditando ? 'Guardar Cambios' : 'Crear Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

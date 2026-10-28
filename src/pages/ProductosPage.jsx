import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getProductos,
  getCategorias,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} from '../services/productosService';
import { formatCurrency } from '../utils/formatters';
import { isNonNegativeNumber } from '../utils/validations';
import AlertMessage from '../components/AlertMessage';

export default function ProductosPage() {
  const { activeLocalId, isAdmin } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [mensaje, setMensaje] = useState(null);

  // Estado para el modal o formulario de alta/edición
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: 'cat_vinos',
    es_comida: false,
    precio_yofre: '',
    precio_gpaz: '',
    stock_inicial_yofre: '10',
    stock_inicial_gpaz: '10'
  });

  const cargarDatos = () => {
    // Si se pasa activeLocalId, devuelve con precios y stock de ese local; pero para editar el catálogo queremos ver todos
    const prods = getProductos(null, false); // catálogo completo
    const cats = getCategorias();
    setProductos(prods);
    setCategorias(cats);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModalNuevo = () => {
    setProductoEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      categoria_id: categorias[0]?.id || 'cat_vinos',
      es_comida: false,
      precio_yofre: '10000',
      precio_gpaz: '11000',
      stock_inicial_yofre: '15',
      stock_inicial_gpaz: '15'
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (prod) => {
    setProductoEditando(prod);
    // Buscar precios actuales
    const detalle = getProductos('loc_yofre', false).find((p) => p.id === prod.id);
    const detalleGpaz = getProductos('loc_gpaz', false).find((p) => p.id === prod.id);

    setFormData({
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      categoria_id: prod.categoria_id,
      es_comida: Boolean(prod.es_comida),
      precio_yofre: detalle ? String(detalle.precio || '') : '',
      precio_gpaz: detalleGpaz ? String(detalleGpaz.precio || '') : '',
      stock_inicial_yofre: '',
      stock_inicial_gpaz: ''
    });
    setMostrarModal(true);
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setMensaje({ type: 'danger', text: 'El nombre del producto es obligatorio.' });
      return;
    }

    if (formData.es_comida) {
      if (!isNonNegativeNumber(formData.precio_gpaz)) {
        setMensaje({ type: 'danger', text: 'El precio para General Paz debe ser un número válido.' });
        return;
      }
    } else {
      if (!isNonNegativeNumber(formData.precio_yofre) || !isNonNegativeNumber(formData.precio_gpaz)) {
        setMensaje({ type: 'danger', text: 'Debe ingresar precios válidos para ambos locales.' });
        return;
      }
    }

    try {
      const precios = {
        loc_yofre: formData.es_comida ? null : Number(formData.precio_yofre),
        loc_gpaz: Number(formData.precio_gpaz)
      };

      if (productoEditando) {
        actualizarProducto(productoEditando.id, formData, precios);
        setMensaje({ type: 'success', text: `Producto "${formData.nombre}" actualizado correctamente.` });
      } else {
        const stockInicial = {
          loc_yofre: { stock_actual: Number(formData.stock_inicial_yofre) || 0, stock_minimo: 5 },
          loc_gpaz: { stock_actual: Number(formData.stock_inicial_gpaz) || 0, stock_minimo: 5 }
        };
        crearProducto(formData, precios, stockInicial);
        setMensaje({ type: 'success', text: `Producto "${formData.nombre}" creado exitosamente.` });
      }

      setMostrarModal(false);
      cargarDatos();
    } catch (err) {
      setMensaje({ type: 'danger', text: err.message || 'Error al guardar el producto.' });
    }
  };

  const handleEliminar = (id, nombre) => {
    if (window.confirm(`¿Desea dar de baja el producto "${nombre}" del catálogo?`)) {
      eliminarProducto(id);
      setMensaje({ type: 'success', text: `Producto "${nombre}" dado de baja.` });
      cargarDatos();
    }
  };

  // Filtrado de productos en memoria
  const productosFiltrados = productos.filter((p) => {
    if (p.activo === false) return false;
    const matchTexto =
      p.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(filtroTexto.toLowerCase()));
    const matchCat = filtroCategoria ? p.categoria_id === filtroCategoria : true;
    return matchTexto && matchCat;
  });

  return (
    <div className="app-container">
      <div className="page-title">
        <div>
          Catálogo Único de Productos y Precios por Local
        </div>
        <button onClick={abrirModalNuevo} className="btn btn-primary">
          + Nuevo Producto
        </button>
      </div>

      <AlertMessage
        type={mensaje?.type}
        message={mensaje?.text}
        onClose={() => setMensaje(null)}
      />

      {/* Barra de Filtros */}
      <div className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Buscar por nombre o descripción:</label>
          <input
            type="text"
            placeholder="Ej: Malbec, Fernet, Pizza, Corona..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Filtrar por Categoría:</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ paddingTop: '16px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Mostrando <strong>{productosFiltrados.length}</strong> de {productos.length} productos
          </span>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Producto / Nombre</th>
              <th>Categoría</th>
              <th className="text-center">Tipo</th>
              <th className="text-right">Precio en Yofre</th>
              <th className="text-right">Precio en Gral Paz</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '24px', color: '#666' }}>
                  No hay productos cargados en el catálogo aún. Presione <strong>"+ Nuevo Producto"</strong> para comenzar a cargar productos y precios.
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => {
                // Buscar precios de ambos locales
                const pYofre = getProductos('loc_yofre', false).find((item) => item.id === p.id);
                const pGpaz = getProductos('loc_gpaz', false).find((item) => item.id === p.id);

                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.nombre}</strong>
                      {p.descripcion && (
                        <div style={{ fontSize: '11px', color: '#666' }}>{p.descripcion}</div>
                      )}
                    </td>
                    <td>{p.categoria_nombre}</td>
                    <td className="text-center">
                      {p.es_comida ? (
                        <span className="badge badge-ocupada">Cocina / Comida</span>
                      ) : (
                        <span className="badge badge-ok-stock">Bebida</span>
                      )}
                    </td>
                    <td className="text-right">
                      {p.es_comida ? (
                        <em style={{ color: '#888' }}>No aplica (Solo GPaz)</em>
                      ) : pYofre && pYofre.precio > 0 ? (
                        formatCurrency(pYofre.precio)
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-right">
                      <strong>
                        {pGpaz && pGpaz.precio > 0 ? formatCurrency(pGpaz.precio) : '-'}
                      </strong>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => abrirModalEditar(p)}
                        className="btn btn-sm"
                        style={{ marginRight: '6px' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(p.id, p.nombre)}
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

      {/* Modal de Alta / Edición de Producto */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{productoEditando ? 'Editar Producto y Precios' : 'Nuevo Producto al Catálogo'}</h3>
              <button onClick={() => setMostrarModal(false)} className="btn btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardar}>
              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Trapiche Medalla Malbec 750ml"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Descripción / Región / Notas</label>
                <input
                  type="text"
                  placeholder="Ej: Mendoza - Gran reserva roble"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => {
                      const esComidaCat = e.target.value === 'cat_comidas';
                      setFormData({
                        ...formData,
                        categoria_id: e.target.value,
                        es_comida: esComidaCat
                      });
                    }}
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ paddingTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.es_comida}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          es_comida: e.target.checked,
                          categoria_id: e.target.checked ? 'cat_comidas' : formData.categoria_id
                        })
                      }
                    />
                    <span>Es plato de comida (Solo General Paz)</span>
                  </label>
                </div>
              </div>

              <h4 style={{ fontSize: '13px', borderBottom: '1px solid #ccc', margin: '14px 0 10px', paddingBottom: '4px' }}>
                Precios Relacionales por Local Físico (ARS)
              </h4>

              <div className="grid-2">
                <div className="form-group">
                  <label>Precio Club 22 Yofre ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    disabled={formData.es_comida}
                    placeholder={formData.es_comida ? 'No disponible en Yofre' : '12500'}
                    value={formData.precio_yofre}
                    onChange={(e) => setFormData({ ...formData, precio_yofre: e.target.value })}
                  />
                  {formData.es_comida && (
                    <small style={{ color: '#777' }}>Yofre solo vende bebidas.</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Precio Club 22 General Paz ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    placeholder="13500"
                    value={formData.precio_gpaz}
                    onChange={(e) => setFormData({ ...formData, precio_gpaz: e.target.value })}
                  />
                </div>
              </div>

              {!productoEditando && (
                <>
                  <h4 style={{ fontSize: '13px', borderBottom: '1px solid #ccc', margin: '14px 0 10px', paddingBottom: '4px' }}>
                    Stock Inicial
                  </h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Stock inicial Yofre</label>
                      <input
                        type="number"
                        min="0"
                        disabled={formData.es_comida}
                        value={formData.stock_inicial_yofre}
                        onChange={(e) => setFormData({ ...formData, stock_inicial_yofre: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock inicial General Paz</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock_inicial_gpaz}
                        onChange={(e) => setFormData({ ...formData, stock_inicial_gpaz: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setMostrarModal(false)} className="btn">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {productoEditando ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

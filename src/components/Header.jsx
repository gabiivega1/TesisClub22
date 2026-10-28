import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, isAdmin, locales, activeLocalId, activeLocal, switchActiveLocal, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-top">
        <div>
          <span className="brand-title">CLUB 22</span>
          <span className="brand-subtitle">Vinería & Bar — Córdoba</span>
        </div>

        <div className="user-badge-bar">
          <div>
            <strong>{user.nombre}</strong>{' '}
            <span className={`role-tag ${user.rol}`}>{user.rol}</span>
          </div>

          <div className="local-selector-box">
            <span>Local:</span>
            {isAdmin ? (
              <select
                value={activeLocalId}
                onChange={(e) => switchActiveLocal(e.target.value)}
                style={{ width: 'auto', fontWeight: 'bold' }}
                title="Cambiar local de trabajo activo"
              >
                {locales.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nombre} {loc.tiene_cocina ? '(con Cocina)' : '(solo Bebidas)'}
                  </option>
                ))}
              </select>
            ) : (
              <strong>{activeLocal?.nombre}</strong>
            )}
          </div>

          <button onClick={handleLogout} className="btn btn-sm">
            Cerrar Sesión
          </button>
        </div>
      </div>

      <nav className="nav-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/pos">Punto de Venta</NavLink>
        <NavLink to="/mesas">Mesas & Cuentas</NavLink>
        <NavLink to="/cocina">
          Cocina {activeLocalId === 'loc_yofre' ? '(Solo Gral Paz)' : ''}
        </NavLink>
        <NavLink to="/productos">Productos & Precios</NavLink>
        <NavLink to="/stock">Stock e Inventario</NavLink>
        <NavLink to="/combos-promos">Combos & Promociones</NavLink>
        <NavLink to="/reservas">Reservas</NavLink>
        <NavLink to="/transferencias" style={{ opacity: 0.8 }}>
          Transferencias (Próx)
        </NavLink>
        <NavLink to="/historial" style={{ opacity: 0.8 }}>
          Historial (Próx)
        </NavLink>
        <NavLink to="/clientes" style={{ opacity: 0.8 }}>
          Clientes (Próx)
        </NavLink>
      </nav>
    </header>
  );
}

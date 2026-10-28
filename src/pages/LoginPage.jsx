import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsuariosDemo } from '../services/authService';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const usuariosDemo = getUsuariosDemo();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    try {
      login(demoEmail, demoPass);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '600px', marginTop: '40px' }}>
      <div className="card">
        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Club 22 — Acceso al Sistema</h2>
        

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@club22.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
            Ingresar al Sistema
          </button>
        </form>

        <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', marginBottom: '10px', color: '#444' }}>
            Acceso Rápido
          </h4>
          

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {usuariosDemo.map((usr) => (
              <div
                key={usr.id}
                style={{
                  border: '1px solid #ccc',
                  padding: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <div>
                  <strong>{usr.nombre}</strong>
                  <div style={{ fontSize: '12px', color: '#555' }}>
                    Rol: <span className={`role-tag ${usr.rol}`}>{usr.rol}</span> — {usr.local_nombre}
                  </div>
                  <div style={{ fontSize: '11px', color: '#777' }}>
                    Usuario: <code>{usr.email}</code> | Pass: <code>{usr.password}</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin(usr.email, usr.password)}
                  className="btn btn-sm btn-primary"
                >
                  Entrar como {usr.rol === 'admin' ? 'Dueño' : 'Empleado'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

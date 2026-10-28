import React, { useState, useEffect } from 'react';
import { getTable } from '../services/db';

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    setClientes(getTable('clientes'));
  }, []);

  return (
    <div className="app-container">
      <div className="page-title">
        <div>Gestión de Clientes Frecuentes</div>
        <span className="badge badge-ocupada">ETAPA 3 — EN CONSTRUCCIÓN</span>
      </div>

      <div className="alert alert-info">
        <strong>Aviso de Avance:</strong> Módulo de fidelización de clientes en desarrollo. Próximamente permitirá acumulación de puntos por compras de vinos en Yofre y consumos en General Paz, promociones personalizadas y cuentas corrientes de clientes preferenciales.
      </div>

      <div className="card">
        <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Clientes Registrados en Base de Datos</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nombre y Apellido</th>
                <th>Teléfono</th>
                <th>Correo Electrónico</th>
                <th>DNI</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center" style={{ color: '#888', padding: '16px' }}>
                    No hay clientes cargados.
                  </td>
                </tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.nombre}</strong></td>
                    <td>{c.telefono}</td>
                    <td>{c.email}</td>
                    <td>{c.dni}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

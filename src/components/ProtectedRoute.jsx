import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.rol !== requiredRole) {
    return (
      <div className="app-container">
        <div className="alert alert-danger">
          Acceso no autorizado: Esta sección requiere rol de {requiredRole}.
        </div>
      </div>
    );
  }

  return children;
}

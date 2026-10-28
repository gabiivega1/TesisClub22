import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PuntoDeVentaPage from './pages/PuntoDeVentaPage';
import MesasPage from './pages/MesasPage';
import CocinaPage from './pages/CocinaPage';
import ProductosPage from './pages/ProductosPage';
import StockPage from './pages/StockPage';
import CombosPromocionesPage from './pages/CombosPromocionesPage';
import ReservasPage from './pages/ReservasPage';
import TransferenciasPage from './pages/TransferenciasPage';
import HistorialPage from './pages/HistorialPage';
import ClientesPage from './pages/ClientesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <PuntoDeVentaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mesas"
            element={
              <ProtectedRoute>
                <MesasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cocina"
            element={
              <ProtectedRoute>
                <CocinaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos"
            element={
              <ProtectedRoute>
                <ProductosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock"
            element={
              <ProtectedRoute>
                <StockPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/combos-promos"
            element={
              <ProtectedRoute>
                <CombosPromocionesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservas"
            element={
              <ProtectedRoute>
                <ReservasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transferencias"
            element={
              <ProtectedRoute>
                <TransferenciasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute>
                <HistorialPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <ClientesPage />
              </ProtectedRoute>
            }
          />

          {/* Redirecciones por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as authLogin, logout as authLogout } from '../services/authService';
import { getLocales } from '../services/localesService';
import { resetDb } from '../services/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [locales, setLocales] = useState(() => getLocales());
  const [activeLocalId, setActiveLocalId] = useState(() => {
    const u = getCurrentUser();
    if (!u) return 'loc_yofre';
    return u.local_id || 'loc_gpaz'; // Admin inicia por defecto en General Paz o Yofre
  });

  useEffect(() => {
    setLocales(getLocales());
  }, []);

  const login = (email, password) => {
    const sessionUser = authLogin(email, password);
    setUser(sessionUser);
    if (sessionUser.local_id) {
      setActiveLocalId(sessionUser.local_id);
    } else {
      setActiveLocalId('loc_gpaz');
    }
    return sessionUser;
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const switchActiveLocal = (newLocalId) => {
    if (user && user.rol === 'admin') {
      setActiveLocalId(newLocalId);
    }
  };

  const resetDemo = () => {
    if (user && user.rol === 'admin') {
      resetDb();
      setLocales(getLocales());
      window.location.reload();
    }
  };

  const activeLocal = locales.find((l) => l.id === activeLocalId) || locales[0] || null;

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.rol === 'admin',
    isEmpleado: user?.rol === 'empleado',
    locales,
    activeLocalId,
    activeLocal,
    login,
    logout,
    switchActiveLocal,
    resetDemo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}

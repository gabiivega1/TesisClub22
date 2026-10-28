/**
 * Servicio de autenticación y perfiles de usuario
 */

import { getTable } from './db';

const SESSION_KEY = 'club22_active_session';

export function getUsuariosDemo() {
  const usuarios = getTable('perfiles');
  const locales = getTable('locales');
  return usuarios.map((usr) => {
    const loc = locales.find((l) => l.id === usr.local_id);
    return {
      ...usr,
      local_nombre: loc ? loc.nombre : 'Ambos Locales (Consolidado)'
    };
  });
}

export function login(email, password) {
  const usuarios = getTable('perfiles');
  const user = usuarios.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    throw new Error('Credenciales inválidas. Verifique correo y contraseña.');
  }

  // Guardar en sesión activa
  const sessionData = {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    local_id: user.local_id
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  return sessionData;
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Capa de almacenamiento y simulación de base de datos relacional en localStorage.
 * Centraliza todo el acceso a datos. Los componentes nunca interactúan con localStorage.
 */

import { INITIAL_DATA } from '../data/seedData';

// Versión actualizada de la clave para asegurar que arranque completamente en blanco
const DB_KEY = 'club22_db_v2';

export function getDb() {
  try {
    // Limpieza de claves anteriores si existieran
    if (localStorage.getItem('club22_db_v1')) {
      localStorage.removeItem('club22_db_v1');
    }

    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(INITIAL_DATA));
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer de localStorage, restaurando base vacía:', err);
    const initial = JSON.parse(JSON.stringify(INITIAL_DATA));
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
}

export function saveDb(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Error al guardar en localStorage:', err);
  }
}

export function resetDb() {
  const initial = JSON.parse(JSON.stringify(INITIAL_DATA));
  localStorage.setItem(DB_KEY, JSON.stringify(initial));
  return initial;
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

// Helpers relacionales genéricos
export function getTable(tableName) {
  const db = getDb();
  return db[tableName] || [];
}

export function getById(tableName, id) {
  const table = getTable(tableName);
  return table.find((row) => row.id === id) || null;
}

export function insertRecord(tableName, record) {
  const db = getDb();
  if (!db[tableName]) {
    db[tableName] = [];
  }
  const newRecord = {
    id: record.id || generateId(tableName.substring(0, 3)),
    ...record
  };
  db[tableName].push(newRecord);
  saveDb(db);
  return newRecord;
}

export function updateRecord(tableName, id, updates) {
  const db = getDb();
  if (!db[tableName]) return null;
  const index = db[tableName].findIndex((row) => row.id === id);
  if (index === -1) return null;
  db[tableName][index] = { ...db[tableName][index], ...updates };
  saveDb(db);
  return db[tableName][index];
}

export function deleteRecord(tableName, id) {
  const db = getDb();
  if (!db[tableName]) return false;
  db[tableName] = db[tableName].filter((row) => row.id !== id);
  saveDb(db);
  return true;
}

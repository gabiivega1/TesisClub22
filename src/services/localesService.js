/**
 * Servicio para gestión y consulta de locales físicos
 */

import { getTable, getById } from './db';

export function getLocales() {
  return getTable('locales');
}

export function getLocalById(id) {
  return getById('locales', id);
}

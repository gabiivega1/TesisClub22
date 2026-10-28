/**
 * Validaciones comunes de entrada para formularios y operaciones
 */

export function isPositiveNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

export function isNonNegativeNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

export function validateRequired(fields, obj) {
  const errors = [];
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || String(obj[field]).trim() === '') {
      errors.push(`El campo ${field} es obligatorio.`);
    }
  }
  return errors;
}

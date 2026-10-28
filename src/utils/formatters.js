/**
 * Utilidades de formateo para Club 22 (Moneda ARS, fechas, etc.)
 */

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '$0,00';
  }
  const num = Number(amount);
  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  return `$${integerPart},${decimalPart}`;
}

export function formatDate(isoString, includeTime = true) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (!includeTime) return `${day}/${month}/${year}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (err) {
    return String(isoString);
  }
}

export function formatPaymentMethod(methodKey) {
  const map = {
    efectivo: 'Efectivo',
    debito: 'Tarjeta de Débito',
    credito: 'Tarjeta de Crédito',
    transferencia: 'Transferencia Bancaria',
    mercadopago: 'Mercado Pago'
  };
  return map[methodKey] || methodKey || 'Otro';
}

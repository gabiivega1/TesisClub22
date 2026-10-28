import React from 'react';

export default function AlertMessage({ type = 'info', message, onClose }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

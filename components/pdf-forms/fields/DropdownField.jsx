import React from 'react';

export default function DropdownField({ field, mode, value, onChange, style }) {
  const options = field.options || ['خيار 1', 'خيار 2'];

  if (mode === 'design') {
    return (
      <div style={{ width: '100%', height: '100%', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', fontSize: field.fontSize || 12, ...style }}>
        <span>{field.placeholder || options[0]?.label || options[0]?.value || options[0] || 'اختر...'}</span>
        <span>▼</span>
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      required={field.required}
      style={{ fontSize: field.fontSize || 12, cursor: 'pointer', width: '100%', height: '100%', border: '1px solid #ccc', boxSizing: 'border-box', ...style }}
    >
      <option value="" disabled>{field.placeholder || 'اختر...'}</option>
      {options.map((opt, i) => {
        const optValue = opt.value || opt;
        const optLabel = opt.label || optValue;
        return <option key={i} value={optValue}>{optLabel}</option>;
      })}
    </select>
  );
}

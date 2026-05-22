import React from 'react';

export default function TextField({ field, mode, value, onChange, style }) {
  if (mode === 'design') {
    return (
      <div style={{ width: '100%', height: '100%', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: field.fontSize || 12, overflow: 'hidden', whiteSpace: field.multiline ? 'normal' : 'nowrap', ...style }}>
        {field.placeholder || field.label || 'حقل نصي'}
      </div>
    );
  }

  return field.multiline ? (
    <textarea
      placeholder={field.placeholder}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      required={field.required}
      style={{ fontSize: field.fontSize || 12, resize: 'none', width: '100%', height: '100%', border: '1px solid #ccc', boxSizing: 'border-box', ...style }}
    />
  ) : (
    <input
      type={field.type === 'date' ? 'date' : (field.textType || "text")}
      placeholder={field.placeholder}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      required={field.required}
      style={{ fontSize: field.fontSize || 12, width: '100%', height: '100%', border: '1px solid #ccc', boxSizing: 'border-box', ...style }}
    />
  );
}

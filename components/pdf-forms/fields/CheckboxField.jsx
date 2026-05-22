import React from 'react';

export default function CheckboxField({ field, mode, value, onChange, style }) {
  if (mode === 'design') {
    return (
      <div style={{ width: '100%', height: '100%', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: style?.backgroundColor || 'transparent' }}>
        <span style={{ color: style?.color || '#ccc' }}>✓</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: style?.backgroundColor || 'transparent' }}>
       <input
        type="checkbox"
        checked={!!value}
        onChange={e => onChange(e.target.checked)}
        required={field.required}
        style={{ width: '80%', height: '80%', cursor: 'pointer' }}
      />
    </div>
  );
}

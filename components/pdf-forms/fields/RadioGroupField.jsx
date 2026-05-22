import React from 'react';

export default function RadioGroupField({ field, mode, value, onChange, style }) {
  const options = field.options || ['خيار 1', 'خيار 2'];
  const isHorizontal = field.direction !== 'vertical';

  const containerStyle = { 
    display: 'flex', flexDirection: isHorizontal ? 'row' : 'column', gap: '8px', width: '100%', height: '100%', alignItems: isHorizontal ? 'center' : 'flex-start', justifyContent: 'space-around',
    backgroundColor: style?.backgroundColor || 'transparent'
  };

  if (mode === 'design') {
    return (
      <div style={{...containerStyle, border: '1px dashed #c7d2fe', padding: '4px'}}>
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid ' + (style?.color || '#666') }} />
            <span style={{ fontSize: field.fontSize || 12, color: style?.color || '#666' }}>{opt.label || opt.value || opt}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {options.map((opt, i) => {
        const optValue = opt.value || opt;
        const optLabel = opt.label || optValue;
        return (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: field.fontSize || 12, color: style?.color || '#000' }}>
            <input
              type="radio"
              name={field.name}
              value={optValue}
              checked={value === optValue}
              onChange={e => onChange(e.target.value)}
              required={field.required}
            />
            {optLabel}
          </label>
        );
      })}
    </div>
  );
}

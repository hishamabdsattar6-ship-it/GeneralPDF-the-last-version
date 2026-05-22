import React from 'react';

const fieldTypes = [
  { type: 'text', label: '📝 حقل نصي' },
  { type: 'textarea', label: '📄 نص متعدد الأسطر' },
  { type: 'date', label: '📅 تاريخ' },
  { type: 'checkbox', label: '☑️ مربع اختيار' },
  { type: 'radio', label: '🔘 اختيار من متعدد' },
  { type: 'dropdown', label: '📋 قائمة منسدلة' },
  { type: 'signature', label: '✍️ توقيع' },
];

export default function FieldToolbar({ selectedTool, onSelectTool }) {
  const onDragStart = (e, type) => {
    e.dataTransfer.setData('application/pdf-field', type);
    e.dataTransfer.effectAllowed = 'copy';
    if (onSelectTool) onSelectTool(type);
  };

  return (
    <div className="field-toolbar">
      <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>أنواع الحقول</h3>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>اضغط على الحقل ثم انقر على الصفحة، أو اسحبه مباشرة.</p>
      {fieldTypes.map(ft => (
        <div
          key={ft.type}
          className="field-card"
          draggable
          onDragStart={(e) => onDragStart(e, ft.type)}
          onClick={() => onSelectTool && onSelectTool(ft.type)}
          style={{
            borderColor: selectedTool === ft.type ? '#6366f1' : '#d1d5db',
            background: selectedTool === ft.type ? '#eef2ff' : '#fafafa',
            borderWidth: selectedTool === ft.type ? 2 : 1.5,
          }}
        >
          {ft.label}
        </div>
      ))}
    </div>
  );
}

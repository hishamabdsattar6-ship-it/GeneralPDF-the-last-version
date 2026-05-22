import React, { useState } from 'react';
import TextField from './fields/TextField';
import CheckboxField from './fields/CheckboxField';
import RadioGroupField from './fields/RadioGroupField';
import DropdownField from './fields/DropdownField';

export default function FormPreview({ fields, onExport, onClose }) {
  const [formData, setFormData] = useState({});

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderField = (field) => {
    const commonProps = {
      field,
      mode: 'fill',
      value: formData[field.name],
      onChange: (val) => handleChange(field.name, val)
    };
    const customStyle = { 
      color: field.textColor || '#000000', 
      backgroundColor: field.backgroundColor || (field.type === 'signature' ? '#fafafa' : '#ffffff') 
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return <TextField {...commonProps} style={customStyle} />;
      case 'textarea':
        return <TextField {...commonProps} field={{...field, multiline: true}} style={customStyle} />;
      case 'date':
        return <TextField {...commonProps} field={{...field, type: 'date'}} style={customStyle} />;
      case 'checkbox':
        return <CheckboxField {...commonProps} style={customStyle} />;
      case 'radio':
        return <RadioGroupField {...commonProps} style={customStyle} />;
      case 'dropdown':
        return <DropdownField {...commonProps} style={customStyle} />;
      case 'signature':
        return <TextField {...commonProps} field={{...field, placeholder: 'توقيع (اكتب اسمك هنا)'}} style={customStyle} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: 24, borderRadius: 12, width: '90%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>معاينة تفاعلية (وضع التعبئة)</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', background: '#f0f2f5', display: 'flex', justifyContent: 'center', padding: 24 }}>
          <div className="a4-page">
            {fields.map(field => (
              <div
                key={field.id}
                style={{
                  position: 'absolute',
                  left: field.x,
                  top: field.y,
                  width: field.width,
                  height: field.height,
                }}
              >
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button onClick={() => onExport(formData)} style={{ padding: '8px 24px', background: '#6366f1', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            تصدير PDF النهائي المعبّأ
          </button>
          <button onClick={onClose} style={{ padding: '8px 24px', background: 'white', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

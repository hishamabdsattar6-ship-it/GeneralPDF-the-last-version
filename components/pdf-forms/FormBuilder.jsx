import React, { useState, useRef } from 'react';
import FieldToolbar from './FieldToolbar';
import TextField from './fields/TextField';
import CheckboxField from './fields/CheckboxField';
import RadioGroupField from './fields/RadioGroupField';
import DropdownField from './fields/DropdownField';
import FormPreview from './FormPreview';
import { generateInteractivePDF, downloadPDF, buildFormConfig } from './pdf-forms-utils';

export default function FormBuilder({ onBack }) {
  const [fields, setFields] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [formName, setFormName] = useState('نموذج جديد');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const canvasRef = useRef(null);

  const addField = (type, x, y) => {
    const newField = {
      id: Date.now().toString(),
      type,
      name: `${type}_${Date.now()}`,
      x,
      y,
      width: type === 'checkbox' ? 20 : 150,
      height: type === 'checkbox' ? 20 : 30,
      label: `حقل ${type}`,
      fontSize: 12,
      required: false,
      options: type === 'radio' || type === 'dropdown' ? ['خيار 1', 'خيار 2'] : [],
    };
    
    setFields(prev => [...prev, newField]);
    setSelectedId(newField.id);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    let type = e.dataTransfer.getData('application/pdf-field');
    if (!type && selectedTool) type = selectedTool;
    if (!type) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addField(type, x, y);
    setSelectedTool(null);
  };

  const handleCanvasClick = (e) => {
    if (selectedTool) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addField(selectedTool, x, y);
      setSelectedTool(null);
    } else {
      setSelectedId(null);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const updateField = (id, updates) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selectedField = fields.find(f => f.id === selectedId);

  const renderFieldDesign = (field) => {
    const props = { field, mode: 'design', value: null, onChange: ()=>{} };
    const customStyle = { 
      color: field.textColor || '#000000', 
      backgroundColor: field.backgroundColor || (field.type === 'signature' ? '#fafafa' : '#ffffff') 
    };
    switch (field.type) {
      case 'text': return <TextField {...props} style={customStyle} />;
      case 'textarea': return <TextField {...props} field={{...field, multiline: true}} style={customStyle} />;
      case 'date': return <TextField {...props} field={{...field, type: 'date'}} style={customStyle} />;
      case 'checkbox': return <CheckboxField {...props} style={customStyle} />;
      case 'radio': return <RadioGroupField {...props} style={customStyle} />;
      case 'dropdown': return <DropdownField {...props} style={customStyle} />;
      case 'signature': return <TextField {...props} field={{...field, placeholder: 'منطقة توقيع'}} style={customStyle} />;
      default: return null;
    }
  };

  const handleExportEmpty = async () => {
    try {
      const config = buildFormConfig(fields, formName);
      const pdfBytes = await generateInteractivePDF(config);
      downloadPDF(pdfBytes, `${formName.replace(/\s+/g, '_')}_form.pdf`);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إنشاء PDF');
    }
  };

  return (
    <div className="pdf-forms-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontWeight: 'bold' }}>&larr; رجوع</button>
          <input value={formName} onChange={e=>setFormName(e.target.value)} style={{ fontSize: 18, fontWeight: 'bold', border: 'none', outline: 'none', padding: '4px 8px', borderRadius: 4, background: 'var(--border)', color: 'var(--text)' }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowPreview(true)} style={{ padding: '6px 16px', background: 'var(--card)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 6, cursor: 'pointer' }}>معاينة 👁</button>
          <button onClick={handleExportEmpty} style={{ padding: '6px 16px', background: 'var(--blue)', border: 'none', color: 'white', borderRadius: 6, cursor: 'pointer' }}>تصدير PDF تفاعلي ↓</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <FieldToolbar selectedTool={selectedTool} onSelectTool={setSelectedTool} />

        <div className="canvas-area" style={{ flex: 1, overflow: 'auto' }} onClick={() => setSelectedId(null)}>
          <div 
            className="a4-page" 
            ref={canvasRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={(e) => {
              e.stopPropagation();
              handleCanvasClick(e);
            }}
          >
            {fields.map(field => (
              <div
                key={field.id}
                className={`field-wrapper ${selectedId === field.id ? 'selected' : ''}`}
                style={{ left: field.x, top: field.y, width: field.width, height: field.height }}
                onClick={() => setSelectedId(field.id)}
              >
                {renderFieldDesign(field)}
                {selectedId === field.id && (
                  <>
                    <div className="resize-handle" onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startW = field.width;
                      const startH = field.height;
                      
                      const onMouseMove = (moveE) => {
                        updateField(field.id, {
                          width: Math.max(20, startW + (moveE.clientX - startX)),
                          height: Math.max(20, startH + (moveE.clientY - startY))
                        });
                      };
                      const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                      };
                      window.addEventListener('mousemove', onMouseMove);
                      window.addEventListener('mouseup', onMouseUp);
                    }} />
                    <button onClick={(e) => { e.stopPropagation(); deleteField(field.id); }} style={{ position: 'absolute', top: -10, right: -10, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12 }}>×</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="properties-panel">
          <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>الخصائص</h3>
          {selectedField ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
                الاسم/التسمية
                <input type="text" value={selectedField.label} onChange={e => updateField(selectedField.id, { label: e.target.value })} style={{ marginTop: 4, padding: 6, border: '1px solid #ccc', borderRadius: 4 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
                اسم الحقل (name)
                <input type="text" value={selectedField.name} onChange={e => updateField(selectedField.id, { name: e.target.value })} style={{ marginTop: 4, padding: 6, border: '1px solid #ccc', borderRadius: 4 }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedField.required} onChange={e => updateField(selectedField.id, { required: e.target.checked })} />
                حقل إلزامي
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
                  لون النص
                  <input type="color" value={selectedField.textColor || '#000000'} onChange={e => updateField(selectedField.id, { textColor: e.target.value })} style={{ marginTop: 4, width: '100%', height: 32, cursor: 'pointer', padding: 0, border: 'none' }} />
                </label>
                
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
                  لون الخلفية
                  <input type="color" value={selectedField.backgroundColor || '#ffffff'} onChange={e => updateField(selectedField.id, { backgroundColor: e.target.value })} style={{ marginTop: 4, width: '100%', height: 32, cursor: 'pointer', padding: 0, border: 'none' }} />
                </label>
              </div>
              {(selectedField.type === 'dropdown' || selectedField.type === 'radio') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: 8 }}>الخيارات</div>
                  {selectedField.options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 4 }}>
                      <input 
                        type="text" 
                        value={opt} 
                        onChange={e => {
                          const newOptions = [...selectedField.options];
                          newOptions[idx] = e.target.value;
                          updateField(selectedField.id, { options: newOptions });
                        }}
                        style={{ flex: 1, padding: 4, fontSize: 12, border: '1px solid #ccc', borderRadius: 4 }}
                      />
                      <button 
                        onClick={() => {
                          const newOptions = selectedField.options.filter((_, i) => i !== idx);
                          updateField(selectedField.id, { options: newOptions });
                        }}
                        style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '0 8px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      updateField(selectedField.id, { options: [...selectedField.options, `خيار ${selectedField.options.length + 1}`] });
                    }}
                    style={{ background: '#f3f4f6', border: '1px dashed #9ca3af', borderRadius: 4, padding: 6, fontSize: 12, cursor: 'pointer', marginTop: 4 }}
                  >
                    + إضافة خيار
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 40 }}>اختر حقلاً لتعديل خصائصه</div>
          )}
        </div>
      </div>

      {showPreview && <FormPreview fields={fields} onClose={() => setShowPreview(false)} onExport={handleExportEmpty} />}
    </div>
  );
}

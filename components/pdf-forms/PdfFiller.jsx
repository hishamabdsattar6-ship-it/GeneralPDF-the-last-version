import React, { useState, useRef } from 'react';
import FieldToolbar from './FieldToolbar';
import TextField from './fields/TextField';
import CheckboxField from './fields/CheckboxField';
import RadioGroupField from './fields/RadioGroupField';
import DropdownField from './fields/DropdownField';
import FormPreview from './FormPreview';
import { fillExistingPDF, downloadPDF } from './pdf-forms-utils';

import { loadPdfJs } from '../../lib/pdfjs-loader.js';

export default function PdfFiller({ onBack }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const canvasRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;
    setPdfFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await loadPdfJs();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
        fontExtraProperties: true,
        disableFontFace: false,
      }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: ctx, viewport }).promise;
      setBgImage(canvas.toDataURL());
    } catch (err) {
      console.error('Failed to render PDF preview', err);
      alert('فشل عرض ملف PDF، تأكد من أن المكتبة محملة بشكل صحيح.');
    }
  };

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
    switch (field.type) {
      case 'text': return <TextField {...props} />;
      case 'checkbox': return <CheckboxField {...props} />;
      case 'radio': return <RadioGroupField {...props} />;
      case 'dropdown': return <DropdownField {...props} />;
      case 'signature': return <TextField {...props} field={{...field, placeholder: 'منطقة توقيع'}} />;
      default: return null;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!bgImage) return;
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

  const handleExportFill = async (formData) => {
    if (!pdfFile) return;
    try {
      const pdfBytes = await fillExistingPDF(pdfFile, fields, formData);
      downloadPDF(pdfBytes, `filled_${pdfFile.name}`);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء تعبئة وتصدير الملف');
    }
  };

  if (!bgImage) {
    return (
      <div className="pdf-forms-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: 24, right: 24, padding: '8px 16px', background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}>&larr; رجوع</button>
        <div style={{ textAlign: 'center', padding: 40, border: '2px dashed var(--border)', borderRadius: 12, background: 'var(--card)', maxWidth: 400 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16, color: 'var(--text)' }}>الخطوة 1: ارفع ملف PDF</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>سيتم عرض الصفحة الأولى كخلفية لتتمكن من وضع الحقول فوقها بدقة.</p>
          <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} id="pdf-upload" />
          <label htmlFor="pdf-upload" style={{ padding: '12px 24px', background: 'var(--blue)', color: 'white', borderRadius: 8, cursor: 'pointer', display: 'inline-block' }}>
            اختر ملف PDF
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-forms-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text)' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontWeight: 'bold' }}>&larr; رجوع</button>
          <span style={{ fontSize: 16, fontWeight: 'bold' }}>تعبئة {pdfFile?.name}</span>
        </div>
        <div>
          <button onClick={() => setShowPreview(true)} style={{ padding: '8px 16px', background: '#22c55e', border: 'none', color: 'white', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
            وضع التعبئة الحية
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <FieldToolbar selectedTool={selectedTool} onSelectTool={setSelectedTool} />

        <div className="canvas-area" style={{ flex: 1, overflow: 'auto' }} onClick={() => setSelectedId(null)}>
          <div 
            ref={canvasRef}
            style={{ width: 794, minHeight: 1123, background: `url(${bgImage}) no-repeat center/contain`, backgroundColor: 'white', position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
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
                onClick={(e) => { e.stopPropagation(); setSelectedId(field.id); }}
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
                <input type="text" value={selectedField.label || ''} onChange={e => updateField(selectedField.id, { label: e.target.value })} style={{ marginTop: 4, padding: 6, border: '1px solid #ccc', borderRadius: 4 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
                اسم الحقل (name)
                <input type="text" value={selectedField.name || ''} onChange={e => updateField(selectedField.id, { name: e.target.value })} style={{ marginTop: 4, padding: 6, border: '1px solid #ccc', borderRadius: 4 }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedField.required || false} onChange={e => updateField(selectedField.id, { required: e.target.checked })} />
                حقل إلزامي
              </label>
              {(selectedField.type === 'dropdown' || selectedField.type === 'radio') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: 8 }}>الخيارات</div>
                  {selectedField.options?.map((opt, idx) => (
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
                      const currentOptions = selectedField.options || [];
                      updateField(selectedField.id, { options: [...currentOptions, `خيار ${currentOptions.length + 1}`] });
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

      {showPreview && <FormPreview fields={fields} onClose={() => setShowPreview(false)} onExport={handleExportFill} />}
    </div>
  );
}

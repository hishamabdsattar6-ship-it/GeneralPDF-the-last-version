
import React, { useState, useEffect, useRef } from 'react';

export default function TemplateEditor({ template, onBack }) {
  const [formData, setFormData] = useState({});
  const [exporting, setExporting] = useState(false);
  const [zoom, setZoom] = useState(0.65);
  const iframeRef = useRef(null);

  // Initialize form data with empty strings for all fields
  useEffect(() => {
    const initialData = {};
    template.fields.forEach(f => {
      initialData[f.key] = '';
    });
    
    // Load draft if exists
    const loadDraft = async () => {
      try {
        if (window.storage) {
          const draft = await window.storage.get(`draft_${template.id}`);
          if (draft && draft.value) {
            setFormData(JSON.parse(draft.value).formData);
          } else {
            setFormData(initialData);
          }
        } else {
          setFormData(initialData);
        }
      } catch (e) {
        setFormData(initialData);
      }
    };
    loadDraft();
  }, [template]);

  // Update iframe preview
  useEffect(() => {
    if (iframeRef.current) {
      const html = template.getHTML(formData);
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(html);
      doc.close();
    }
  }, [formData, template]);

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const saveDraft = async () => {
    if (window.storage) {
      await window.storage.set(
        `draft_${template.id}`,
        JSON.stringify({ formData, timestamp: Date.now() })
      );
      alert('تم حفظ المسودة بنجاح');
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:794px;height:1123px;position:fixed;left:-9999px;top:0';
      document.body.appendChild(iframe);
      
      const htmlContent = template.getHTML(formData);
      iframe.contentDocument.open();
      iframe.contentDocument.write(htmlContent);
      iframe.contentDocument.close();
      
      // Wait for fonts/images
      await new Promise(r => setTimeout(r, 2000));
      
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(iframe.contentDocument.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 794,
        height: 1123
      });
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      pdf.save(`${template.name}_${new Date().toLocaleDateString('ar-EG')}.pdf`);
      
      document.body.removeChild(iframe);
    } catch (error) {
      console.error('Export failed:', error);
      alert('فشل التصدير: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="templates-page" style={{ maxWidth: '1400px' }}>
      <button className="btn-back" onClick={onBack}>
        ← العودة للمعرض
      </button>

      <div className="editor-container">
        {/* Input Panel */}
        <div className="editor-form-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
            <span style={{ fontSize: '32px' }}>{template.icon}</span>
            <div>
              <h2 style={{ fontSize: '20px', color: template.color }}>{template.name}</h2>
              <p style={{ fontSize: '13px', color: '#666' }}>أدخل البيانات المطلوبة لتحديث المعاينة</p>
            </div>
          </div>

          <div className="form-fields">
            {template.fields.map(field => (
              <div key={field.key} className="form-group">
                <label className="form-label">
                  {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="form-textarea"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={`أدخل ${field.label}...`}
                  />
                ) : (
                  <input
                    type={field.type}
                    className="form-input"
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={`أدخل ${field.label}...`}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button className="btn-export" style={{ flexGrow: 1 }} onClick={exportToPDF} disabled={exporting}>
              {exporting ? 'جاري التصدير...' : '⬇️ تصدير PDF'}
            </button>
            <button 
              className="tab-btn" 
              style={{ background: '#f1f5f9' }} 
              onClick={saveDraft}
            >
              💾 حفظ مسودة
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="editor-preview-panel">
          <div style={{ alignSelf: 'flex-start', marginBottom: '15px', color: '#64748b', fontSize: '13px' }}>
             المعاينة الحية (A4)
          </div>
          
          <div className="preview-frame-wrap" style={{ transform: `scale(${zoom})` }}>
            <iframe ref={iframeRef} className="preview-frame" title="preview" />
          </div>

          <div style={{ display: 'flex', gap: '15px', background: 'white', padding: '10px 20px', borderRadius: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <button className="tab-btn" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>-</button>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 700 }}>{Math.round(zoom * 100)}%</div>
            <button className="tab-btn" onClick={() => setZoom(z => Math.min(1.2, z + 0.1))}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

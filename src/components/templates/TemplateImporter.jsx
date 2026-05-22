
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function TemplateImporter({ onBack, onImported }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState([]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      if (file.name.endsWith('.docx')) {
        const { default: mammoth } = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setFileContent(result.value);
        setStep(2);
      } else if (file.name.endsWith('.pdf')) {
        // PDF to Image or text (simple version for this demo)
        alert('استيراد PDF يحتاج معالجة إضافية لفتح النصوص، يفضل استخدام DOCX حالياً.');
      } else {
        alert('يرجى اختيار ملف .docx');
      }
    } catch (err) {
      alert('فشل قراءة الملف: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      const fieldName = prompt('أدخل اسم الحقل (مثال: الاسم، التاريخ):');
      if (fieldName) {
        const fieldKey = `field_${fields.length + 1}`;
        setFields([...fields, { key: fieldKey, label: fieldName, original: selectedText }]);
        
        // Highlight in content
        const newContent = fileContent.replace(
          selectedText, 
          `<span style="background: #fff3cd; border: 1px solid #ffeeba; padding: 0 4px; border-radius: 4px; color: #856404;">{{${fieldName}}}</span>`
        );
        setFileContent(newContent);
      }
    }
  };

  const saveImportedTemplate = async () => {
    if (!templateName) {
      alert('الرجاء إدخال اسم للقالب');
      return;
    }

    const newTemplate = {
      id: `imported_${uuidv4()}`,
      name: templateName,
      category: 'مستورد',
      html: fileContent,
      fields: fields.map(f => ({ key: f.key, label: f.label, type: 'text', required: true })),
      createdAt: Date.now()
    };

    if (window.storage) {
      await window.storage.set(
        newTemplate.id,
        JSON.stringify(newTemplate)
      );
    }

    alert('تم حفظ القالب في مكتبتك');
    onImported();
  };

  return (
    <div className="templates-page">
      <button className="btn-back" onClick={onBack}>
        ← العودة
      </button>

      <div className="importer-card">
        {step === 1 && (
          <div>
            <h2 className="card-title">استيراد قالب جديد</h2>
            <p className="card-desc">ارفع ملف Word (.docx) وسنقوم بتحويله إلى قالب قابل للتعديل</p>
            <div 
              className="drop-zone"
              onClick={() => document.getElementById('import-input').click()}
            >
              <input 
                type="file" 
                id="import-input" 
                hidden 
                accept=".docx" 
                onChange={handleFileUpload}
              />
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
              {loading ? <p>جاري التحميل والمعالجة...</p> : <p>انقر هنا لاختيار ملف .docx</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'right' }}>
            <h2 className="card-title">تحديد الحقول المتغيرة</h2>
            <p className="card-desc">ظلّل النص الذي تريد جعله حقلاً قابلاً للتعبئة وانقر على "تحديد حقل"</p>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <button className="tab-btn active" onClick={handleTextSelection}>
                ✨ تحديد النص المظلل كحقل
              </button>
              <button className="tab-btn" onClick={() => setStep(3)}>
                التالي: حفظ القالب
              </button>
            </div>

            <div 
              style={{ 
                border: '1px solid #eee', 
                padding: '30px', 
                borderRadius: '8px', 
                maxHeight: '500px', 
                overflowY: 'auto',
                background: '#fefefe'
              }}
              dangerouslySetInnerHTML={{ __html: fileContent }}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="card-title">حفظ القالب النهائي</h2>
            <div className="form-group" style={{ textAlign: 'right' }}>
              <label className="form-label">اسم القالب</label>
              <input 
                className="form-input" 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="أدخل اسماً للقالب (مثال: عقد إيجار شقتي)"
              />
            </div>
            
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <p style={{ fontWeight: 700, marginBottom: '10px' }}>الحقول المعرفة:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {fields.map(f => (
                  <span key={f.key} style={{ background: '#e2e8f0', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' }}>
                    {f.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '40px' }}>
              <button className="btn-export" style={{ width: '100%' }} onClick={saveImportedTemplate}>
                💾 حفظ في مكتبتي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

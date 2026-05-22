import React, { useState, useEffect } from 'react';
import FormBuilder from './FormBuilder';
import PdfFiller from './PdfFiller';
import './pdf-forms.css';

export default function PdfFormsPage() {
  const [mode, setMode] = useState('home');

  // التأكد من تحميل pdfjs-dist إذا لم يكن موجوداً
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }
  }, []);

  if (mode === 'builder') {
    return <FormBuilder onBack={() => setMode('home')} />;
  }

  if (mode === 'filler') {
    return <PdfFiller onBack={() => setMode('home')} />;
  }

  return (
    <div className="pdf-forms-page" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 'bold', color: 'var(--text)', marginBottom: 16 }}>نماذج PDF التفاعلية</h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 600, margin: '0 auto' }}>
          أنشئ نماذج PDF تفاعلية بالكامل مع دعم للغة العربية، أو عبّئ ملفات PDF الموجودة لديك مسبقاً بكل سهولة.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        
        <div 
          onClick={() => setMode('builder')}
          style={{ width: 340, background: 'var(--card)', padding: 32, borderRadius: 16, boxShadow: '0 4px 6px -1px var(--border)', cursor: 'pointer', transition: 'transform 0.2s', textAlign: 'center', border: '2px solid transparent' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔨</div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: 'var(--text)' }}>أنشئ نموذجاً من الصفر</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>صمم نموذجاً تفاعلياً جديداً بخاصية السحب والإفلات. أضف حقول النص، مربعات الاختيار، والتوقيعات بسهولة.</p>
        </div>

        <div 
          onClick={() => setMode('filler')}
          style={{ width: 340, background: 'var(--card)', padding: 32, borderRadius: 16, boxShadow: '0 4px 6px -1px var(--border)', cursor: 'pointer', transition: 'transform 0.2s', textAlign: 'center', border: '2px solid transparent' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: 'var(--text)' }}>عبّئ PDF موجود</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>ارفع ملف PDF خاص بك، وأضف فوقه حقولاً تفاعلية قابلة للتعبئة ثم قم بتصديره جاهزاً للاستخدام.</p>
        </div>

      </div>
    </div>
  );
}

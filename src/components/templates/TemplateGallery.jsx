
import React, { useState } from 'react';
import { templates } from './templates-data';

export default function TemplateGallery({ onSelectTemplate, onImport }) {
  const [filter, setFilter] = useState('الكل');
  
  const categories = ['الكل', 'إداري', 'قانوني', 'شخصي'];
  
  const filteredTemplates = filter === 'الكل' 
    ? templates 
    : templates.filter(t => t.category === filter);

  return (
    <div className="templates-page">
      <div className="gallery-header">
        <div>
          <h1 style={{ fontSize: '28px', color: '#1a3a5c' }}>مكتبة القوالب العربية</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>اختر قالباً احترافياً وابدأ التعديل فوراً</p>
        </div>
        <button 
          className="btn-export" 
          onClick={onImport}
          style={{ background: '#f8fafc', color: '#1a3a5c', border: '1px solid #e2e8f0' }}
        >
          📥 استيراد قالب خاص
        </button>
      </div>

      <div className="gallery-tabs">
        {categories.map(cat => (
          <button 
            key={cat}
            className={`tab-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="templates-grid">
        {filteredTemplates.map(template => (
          <div 
            key={template.id} 
            className="template-card"
            onClick={() => onSelectTemplate(template)}
          >
            <div 
              className="card-thumb" 
              style={{ background: template.color }}
            >
              <div className="card-badge">{template.category}</div>
              <div className="card-icon">{template.icon}</div>
              <div style={{ fontWeight: 700 }}>{template.name}</div>
            </div>
            <div className="card-body">
              <div className="card-title">{template.name}</div>
              <p className="card-desc">{template.description}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ color: template.color, fontWeight: 700, fontSize: '14px' }}>استخدم القالب ←</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

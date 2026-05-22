
"use client"
import React, { useState } from 'react';
import TemplateGallery from './TemplateGallery';
import TemplateEditor from './TemplateEditor';
import TemplateImporter from './TemplateImporter';
import './templates.css';

export default function TemplatesPage() {
  const [view, setView] = useState('gallery'); // 'gallery', 'editor', 'import'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setView('editor');
  };

  const handleImport = () => {
    setView('import');
  };

  const handleBackToGallery = () => {
    setView('gallery');
    setSelectedTemplate(null);
  };

  return (
    <div className="templates-shell">
      {view === 'gallery' && (
        <TemplateGallery 
          onSelectTemplate={handleSelectTemplate} 
          onImport={handleImport}
        />
      )}

      {view === 'editor' && selectedTemplate && (
        <TemplateEditor 
          template={selectedTemplate} 
          onBack={handleBackToGallery}
        />
      )}

      {view === 'import' && (
        <TemplateImporter 
          onBack={handleBackToGallery}
          onImported={handleBackToGallery}
        />
      )}
    </div>
  );
}

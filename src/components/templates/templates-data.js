
export const templates = [
  {
    id: 'official-report',
    name: 'تقرير رسمي',
    category: 'إداري',
    description: 'تقارير رسمية احترافية للمؤسسات',
    color: '#1a3a5c',
    accentColor: '#d4a017',
    icon: '📊',
    fields: [
      { key: 'orgName',     label: 'اسم المؤسسة',     type: 'text',     required: true  },
      { key: 'reportNum',   label: 'رقم التقرير',      type: 'text',     required: true  },
      { key: 'date',        label: 'التاريخ',           type: 'date',     required: true  },
      { key: 'title',       label: 'عنوان التقرير',    type: 'text',     required: true  },
      { key: 'period',      label: 'الفترة الزمنية',   type: 'text',     required: false },
      { key: 'summary',     label: 'الملخص التنفيذي',  type: 'textarea', required: true  },
      { key: 'content',     label: 'المحتوى الرئيسي',  type: 'textarea', required: true  },
      { key: 'recommendations', label: 'التوصيات',     type: 'textarea', required: false },
      { key: 'preparedBy',  label: 'اسم المعد',        type: 'text',     required: true  },
      { key: 'jobTitle',    label: 'المسمى الوظيفي',   type: 'text',     required: true  },
    ],
    getHTML: (data) => `
      <html dir="rtl">
      <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          width:794px; min-height:1123px; font-family:'Tajawal', sans-serif; 
          background:#fff; direction:rtl; padding: 0;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          font-feature-settings: "kern", "liga", "clig", "calt";
        }
        .header { background:linear-gradient(135deg,#1a3a5c,#2d5f8a); padding:40px; color:white; position:relative; }
        .header::after { content:''; position:absolute; bottom:0; right:0; width:100%; height:4px; background:linear-gradient(90deg,#d4a017,#f0c040); }
        .org-name { font-family:'Cairo',sans-serif; font-size:24px; font-weight:900; }
        .doc-title { font-size:18px; opacity:0.85; margin-top:8px; }
        .meta-bar { display:flex; gap:24px; background:#f8f9fa; padding:16px 40px; border-bottom:2px solid #e9ecef; font-size:13px; color:#555; }
        .meta-item span { font-weight:700; color:#1a3a5c; }
        .section { padding:24px 40px; }
        .section-title { font-family:'Cairo',sans-serif; font-size:16px; font-weight:700; color:#1a3a5c; border-right:4px solid #d4a017; padding-right:12px; margin-bottom:12px; }
        .content-text { line-height:1.9; color:#333; font-size:14px; white-space: pre-wrap; }
        .divider { height:1px; background:#e9ecef; margin:0 40px; }
        .footer { background:#f8f9fa; padding:20px 40px; margin-top:auto; border-top:2px solid #1a3a5c; display:flex; justify-content:space-between; align-items:center; }
        .signature-box { text-align:center; }
        .sig-name { font-family:'Cairo',sans-serif; font-weight:700; color:#1a3a5c; }
      </style>
      </head>
      <body>
        <div class="header">
          <div class="org-name">${data.orgName || 'اسم المؤسسة'}</div>
          <div class="doc-title">${data.title || 'عنوان التقرير'}</div>
        </div>
        <div class="meta-bar">
          <div class="meta-item">رقم التقرير: <span>${data.reportNum || '-'}</span></div>
          <div class="meta-item">التاريخ: <span>${data.date || '-'}</span></div>
          <div class="meta-item">الفترة: <span>${data.period || '-'}</span></div>
        </div>
        ${data.summary ? `
        <div class="section">
          <div class="section-title">الملخص التنفيذي</div>
          <div class="content-text">${data.summary}</div>
        </div>
        <div class="divider"></div>` : ''}
        <div class="section">
          <div class="section-title">المحتوى الرئيسي</div>
          <div class="content-text">${data.content || ''}</div>
        </div>
        ${data.recommendations ? `
        <div class="divider"></div>
        <div class="section">
          <div class="section-title">التوصيات</div>
          <div class="content-text">${data.recommendations}</div>
        </div>` : ''}
        <div class="footer">
          <div class="signature-box">
            <div style="width:140px;height:1px;background:#1a3a5c;margin:0 auto 8px"></div>
            <div class="sig-name">${data.preparedBy || 'الاسم'}</div>
            <div style="font-size:12px;color:#666">${data.jobTitle || 'المسمى الوظيفي'}</div>
          </div>
          <div style="font-size:11px;color:#999">وثيقة رسمية - ${data.orgName || ''}</div>
        </div>
      </body>
      </html>`
  },
  {
    id: 'contract-agreement',
    name: 'عقد اتفاق',
    category: 'قانوني',
    description: 'عقود قانونية متكاملة بين طرفين',
    color: '#2c3e50',
    accentColor: '#95a5a6',
    icon: '⚖️',
    fields: [
      { key: 'title',       label: 'موضوع العقد',     type: 'text',     required: true },
      { key: 'firstParty',  label: 'الطرف الأول',     type: 'text',     required: true },
      { key: 'secondParty', label: 'الطرف الثاني',    type: 'text',     required: true },
      { key: 'date',        label: 'تاريخ العقد',     type: 'date',     required: true },
      { key: 'clauses',     label: 'بنود العقد',      type: 'textarea', required: true },
      { key: 'duration',    label: 'مدة العقد',       type: 'text',     required: false },
      { key: 'value',       label: 'قيمة العقد',      type: 'text',     required: false },
    ],
    getHTML: (data) => `
      <html dir="rtl">
      <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          width:794px; min-height:1123px; font-family:'Tajawal', sans-serif; 
          padding:60px; color:#2c3e50; line-height:1.7; 
          text-rendering: optimizeLegibility;
          font-feature-settings: "kern", "liga", "clig", "calt";
        }
        .contract-header { text-align:center; margin-bottom:50px; border-bottom:2px double #2c3e50; padding-bottom:20px; }
        h1 { font-family:'Cairo',sans-serif; color:#2c3e50; font-size:28px; margin-bottom:10px; }
        .parties { display:flex; justify-content:space-between; margin-bottom:40px; background:#f9fbfc; padding:20px; border-radius:8px; border:1px solid #eee; }
        .party { width:45%; }
        .party-title { font-weight:700; color:#2c3e50; margin-bottom:5px; border-bottom:1px solid #2c3e50; display:inline-block; }
        .clauses { counter-reset: item; }
        .clause { margin-bottom:20px; text-align:justify; }
        .clause-title { font-weight:700; margin-bottom:8px; color:#2c3e50; }
        .clause-title::before { counter-increment: item; content: "البند " counter(item) ": "; }
        .signatures { margin-top:80px; display:flex; justify-content:space-between; }
        .sig-col { text-align:center; width:200px; }
        .sig-line { border-top:1px solid #2c3e50; margin-bottom:10px; }
      </style>
      </head>
      <body>
        <div class="contract-header">
          <h1>اتفاقية عقد</h1>
          <div>بشأن: ${data.title || ''}</div>
          <div style="margin-top:10px">تاريخ الإبرام: ${data.date || ''}</div>
        </div>
        <div class="parties">
          <div class="party">
            <div class="party-title">الطرف الأول:</div>
            <div>${data.firstParty || '...'}</div>
          </div>
          <div class="party">
            <div class="party-title">الطرف الثاني:</div>
            <div>${data.secondParty || '...'}</div>
          </div>
        </div>
        <div class="clauses">
          <div class="clause">
            <div class="clause-title">تمهيد</div>
            <p>اتفق الطرفان وهما بكامل أهليتهما المعتبرة شرعاً ونظاماً على الالتزام ببنود هذا العقد الموضحة أدناه.</p>
          </div>
          <div class="clause">
            <div class="clause-title">مدة العقد</div>
            <p>${data.duration || 'تحدد حسب الاتفاق'}</p>
          </div>
          <div class="clause">
            <div class="clause-title">البنود التفصيلية</div>
            <p style="white-space: pre-wrap;">${data.clauses || ''}</p>
          </div>
          ${data.value ? `
          <div class="clause">
            <div class="clause-title">المقابل المادي</div>
            <p>${data.value}</p>
          </div>` : ''}
        </div>
        <div class="signatures">
          <div class="sig-col">
            <div class="sig-line"></div>
            <div style="font-weight:700">توقيع الطرف الأول</div>
          </div>
          <div class="sig-col">
            <div class="sig-line"></div>
            <div style="font-weight:700">توقيع الطرف الثاني</div>
          </div>
        </div>
      </body>
      </html>`
  },
  {
    id: 'official-letter',
    name: 'خطاب رسمي',
    category: 'إداري',
    description: 'مراسلات رسمية بتنسيق بروتوكولي',
    color: '#006747',
    accentColor: '#c8a951',
    icon: '✉️',
    fields: [
      { key: 'recipient',   label: 'الموجه إليه',     type: 'text',     required: true },
      { key: 'subject',     label: 'موضوع الخطاب',   type: 'text',     required: true },
      { key: 'content',     label: 'نص الخطاب',      type: 'textarea', required: true },
      { key: 'senderName',  label: 'اسم المرسل',     type: 'text',     required: true },
      { key: 'senderJob',   label: 'مسمى المرسل',    type: 'text',     required: true },
      { key: 'date',        label: 'التاريخ',         type: 'date',     required: true },
    ],
    getHTML: (data) => `
      <html dir="rtl">
      <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          width:794px; min-height:1123px; font-family:'Tajawal', sans-serif; background:#fff; padding:60px 80px; 
          text-rendering: optimizeLegibility;
          font-feature-settings: "kern", "liga", "clig", "calt";
        }
        .letter-head { display:flex; justify-content:space-between; margin-bottom:60px; border-bottom:4px solid #006747; padding-bottom:20px; }
        .logo-placeholder { background:#006747; color:#fff; width:120px; height:60px; display:flex; align-items:center; justify-content:center; font-weight:900; }
        .date-box { text-align:left; color:#666; font-size:14px; }
        .recipient { margin-bottom:30px; font-weight:700; font-size:18px; color:#006747; }
        .subject { text-align:center; font-weight:900; font-family:'Cairo',sans-serif; font-size:20px; margin-bottom:40px; text-decoration:underline; }
        .content { line-height:2; text-align:justify; margin-bottom:60px; white-space: pre-wrap; }
        .closing { margin-right:auto; text-align:center; width:250px; }
        .closing-title { font-weight:700; margin-bottom:40px; }
      </style>
      </head>
      <body>
        <div class="letter-head">
          <div class="logo-placeholder">شعار المؤسسة</div>
          <div class="date-box">التاريخ: ${data.date || ''}</div>
        </div>
        <div class="recipient">سعادة / ${data.recipient || 'الاسم'} المحترم</div>
        <div class="subject">الموضوع: ${data.subject || ''}</div>
        <p style="margin-bottom:20px">السلام عليكم ورحمة الله وبركاته،، وبعد،،</p>
        <div class="content">${data.content || ''}</div>
        <p style="margin-bottom:40px">وتقبلوا خالص التحية والتقدير،،</p>
        <div class="closing">
          <div class="closing-title">المرسل</div>
          <div style="font-weight:700">${data.senderName || ''}</div>
          <div style="color:#666; font-size:14px">${data.senderJob || ''}</div>
        </div>
      </body>
      </html>`
  },
  {
    id: 'memo',
    name: 'مذكرة داخلية',
    category: 'إداري',
    description: 'مذكرات سريعة للتواصل الداخلي',
    color: '#e67e22',
    accentColor: '#f39c12',
    icon: '📝',
    fields: [
      { key: 'from',        label: 'من',             type: 'text',     required: true },
      { key: 'to',          label: 'إلى',            type: 'text',     required: true },
      { key: 'subject',     label: 'الموضوع',       type: 'text',     required: true },
      { key: 'content',     label: 'المحتوى',       type: 'textarea', required: true },
      { key: 'date',        label: 'التاريخ',        type: 'date',     required: true },
    ],
    getHTML: (data) => `
      <html dir="rtl">
      <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          width:794px; min-height:1123px; font-family:'Tajawal', sans-serif; background:#fff; padding:50px; 
          text-rendering: optimizeLegibility;
          font-feature-settings: "kern", "liga", "clig", "calt";
        }
        .memo-box { border:2px solid #e67e22; height:100%; display:flex; flex-direction:column; }
        .memo-header { background:#e67e22; color:white; padding:20px; font-family:'Cairo',sans-serif; font-size:24px; font-weight:900; text-align:center; }
        .memo-meta { padding:20px; border-bottom:1px solid #eee; background:#fff9f5; }
        .meta-line { margin-bottom:10px; display:flex; gap:10px; }
        .meta-label { font-weight:700; color:#e67e22; width:80px; }
        .memo-content { padding:30px; line-height:1.8; white-space: pre-wrap; flex-grow:1; }
      </style>
      </head>
      <body>
        <div class="memo-box">
          <div class="memo-header">مذكرة داخلية</div>
          <div class="memo-meta">
            <div class="meta-line"><span class="meta-label">من:</span> <span>${data.from || ''}</span></div>
            <div class="meta-line"><span class="meta-label">إلى:</span> <span>${data.to || ''}</span></div>
            <div class="meta-line"><span class="meta-label">التاريخ:</span> <span>${data.date || ''}</span></div>
            <div class="meta-line"><span class="meta-label">الموضوع:</span> <span>${data.subject || ''}</span></div>
          </div>
          <div class="memo-content">${data.content || ''}</div>
          <div style="padding:20px; color:#999; font-size:12px; border-top:1px solid #eee">مذكرة داخلية رسمية</div>
        </div>
      </body>
      </html>`
  },
  {
    id: 'resume',
    name: 'سيرة ذاتية',
    category: 'شخصي',
    description: 'قالب سيرة ذاتية عصري وعملي',
    color: '#6c3483',
    accentColor: '#a569bd',
    icon: '👤',
    fields: [
      { key: 'name',        label: 'الاسم الكامل',   type: 'text',     required: true },
      { key: 'jobTitle',    label: 'المسمى الوظيفي', type: 'text',     required: true },
      { key: 'contact',     label: 'معلومات التواصل', type: 'textarea', required: true },
      { key: 'summary',     label: 'نبذة عني',       type: 'textarea', required: true },
      { key: 'experience',  label: 'الخبرات',       type: 'textarea', required: true },
      { key: 'education',   label: 'التعليم',       type: 'textarea', required: true },
      { key: 'skills',      label: 'المهارات',       type: 'textarea', required: true },
    ],
    getHTML: (data) => `
      <html dir="rtl">
      <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          width:794px; min-height:1123px; font-family:'Tajawal', sans-serif; background:#fff; display:flex; direction:rtl; 
          text-rendering: optimizeLegibility;
          font-feature-settings: "kern", "liga", "clig", "calt";
        }
        .sidebar { width:260px; background:#6c3483; color:white; padding:40px 30px; height:1123px; }
        .main { flex-grow:1; padding:50px 40px; }
        .cv-name { font-family:'Cairo',sans-serif; font-size:28px; font-weight:900; margin-bottom:5px; }
        .cv-title { color:#a569bd; font-weight:700; font-size:18px; margin-bottom:30px; }
        .side-section { margin-bottom:30px; }
        .side-title { border-bottom:1px solid rgba(255,255,255,0.3); padding-bottom:8px; margin-bottom:12px; font-weight:700; text-transform:uppercase; font-size:14px; }
        .side-content { font-size:13px; line-height:1.6; white-space: pre-wrap; }
        .main-section { margin-bottom:40px; }
        .main-title { font-family:'Cairo',sans-serif; font-size:18px; font-weight:700; color:#6c3483; border-right:4px solid #a569bd; padding-right:12px; margin-bottom:15px; }
        .main-content { line-height:1.8; font-size:14px; white-space: pre-wrap; }
      </style>
      </head>
      <body>
        <div class="sidebar">
          <div class="side-section">
            <div class="side-title">التواصل</div>
            <div class="side-content">${data.contact || ''}</div>
          </div>
          <div class="side-section">
            <div class="side-title">المهارات</div>
            <div class="side-content">${data.skills || ''}</div>
          </div>
        </div>
        <div class="main">
          <div class="cv-name">${data.name || 'الاسم'}</div>
          <div class="cv-title">${data.jobTitle || 'المسمى الوظيفي'}</div>
          <div class="main-section">
            <div class="main-title">نبذة عني</div>
            <div class="main-content">${data.summary || ''}</div>
          </div>
          <div class="main-section">
            <div class="main-title">الخبرة العملية</div>
            <div class="main-content">${data.experience || ''}</div>
          </div>
          <div class="main-section">
            <div class="main-title">التعليم</div>
            <div class="main-content">${data.education || ''}</div>
          </div>
        </div>
      </body>
      </html>`
  },
  {
    id: 'project-plan',
    name: 'خطة مشروع',
    category: 'إداري',
    description: 'خطط مشاريع منظمة وشاملة',
    color: '#16213e',
    accentColor: '#e94560',
    icon: '🚀',
    fields: [
      { key: 'projectName', label: 'اسم المشروع',     type: 'text',     required: true },
      { key: 'vision',      label: 'الرؤية والهدف',   type: 'textarea', required: true },
      { key: 'milestones',  label: 'المراحل الرئيسية', type: 'textarea', required: true },
      { key: 'budget',      label: 'الميزانية التقديرية', type: 'text',     required: false },
      { key: 'manager',     label: 'مدير المشروع',    type: 'text',     required: true },
      { key: 'startDate',   label: 'تاريخ البدء',     type: 'date',     required: true },
    ],
    getHTML: (data) => `
      <html dir="rtl">
      <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@400;500;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
          width:794px; min-height:1123px; font-family:'Tajawal', sans-serif; background:#fff; padding:0; 
          text-rendering: optimizeLegibility;
          font-feature-settings: "kern", "liga", "clig", "calt";
        }
        .top-bar { height:12px; background:linear-gradient(90deg,#16213e, #e94560); }
        .hero { background:#16213e; color:white; padding:60px; text-align:center; }
        .hero h1 { font-family:'Cairo',sans-serif; font-size:32px; margin-bottom:10px; }
        .hero p { color:#e94560; font-weight:700; }
        .plan-body { padding:50px; }
        .plan-header { display:flex; justify-content:space-between; margin-bottom:40px; border-bottom:1px solid #eee; padding-bottom:20px; font-size:14px; }
        .plan-section { margin-bottom:40px; }
        .plan-title { font-family:'Cairo',sans-serif; color:#16213e; font-size:20px; font-weight:700; border-bottom:2px solid #e94560; display:inline-block; margin-bottom:15px; }
        .plan-content { line-height:2; white-space: pre-wrap; text-align:justify; }
      </style>
      </head>
      <body>
        <div class="top-bar"></div>
        <div class="hero">
          <h1>خطة عمل المشروع</h1>
          <p>${data.projectName || ''}</p>
        </div>
        <div class="plan-body">
          <div class="plan-header">
            <div>مدير المشروع: <strong>${data.manager}</strong></div>
            <div>تاريخ البدء: <strong>${data.startDate}</strong></div>
            <div>الميزانية: <strong>${data.budget || 'غير محددة'}</strong></div>
          </div>
          <div class="plan-section">
            <div class="plan-title">رؤية وأهداف المشروع</div>
            <div class="plan-content">${data.vision || ''}</div>
          </div>
          <div class="plan-section">
            <div class="plan-title">خارطة الطريق والمراحل</div>
            <div class="plan-content">${data.milestones || ''}</div>
          </div>
        </div>
      </body>
      </html>`
  }
];

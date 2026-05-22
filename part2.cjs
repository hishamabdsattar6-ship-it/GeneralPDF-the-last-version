const fs = require('fs');

const part2 = `
<!-- TOOLS -->
<div class="page" id="page-tools">
  <div class="page-title text-center">
    <h1>الأدوات العادية</h1>
    <p>مجموعة شاملة من أدوات معالجة PDF</p>
  </div>
  <div class="grid3">
    <div class="card" onclick="goPage('merge')"><div class="icon-box" style="background:#eff6ff;color:#3b82f6;">🗂️</div><h3>دمج PDF</h3><p>دمج عدة ملفات PDF في ملف واحد بسهولة.</p></div>
    <div class="card" onclick="goPage('split')"><div class="icon-box" style="background:#eef2ff;color:#6366f1;">✂️</div><h3>تقسيم PDF</h3><p>فصل صفحة أو مجموعة صفحات من ملف PDF.</p></div>
    <div class="card" onclick="goPage('compress')"><div class="icon-box" style="background:#f0fdf4;color:#22c55e;">📦</div><h3>ضغط PDF</h3><p>تقليل حجم ملف PDF مع الحفاظ على الجودة.</p></div>
    <div class="card" onclick="goPage('view')"><div class="icon-box" style="background:#ecfeff;color:#06b6d4;">👁️</div><h3>عرض PDF</h3><p>تصفح ملفات PDF بسلاسة داخل المتصفح.</p></div>
    <div class="card" onclick="goPage('create')"><div class="icon-box" style="background:#f0fdfa;color:#14b8a6;">➕</div><h3>إنشاء PDF</h3><p>إنشاء ملف PDF جديد من النصوص بتنسيق احترافي.</p></div>
    <div class="card" onclick="goPage('number')"><div class="icon-box" style="background:#fdf4ff;color:#d946ef;">🔢</div><h3>ترقيم الصفحات</h3><p>إضافة أرقام الصفحات إلى ملف PDF.</p></div>
    <div class="card" onclick="goPage('sign')"><div class="icon-box" style="background:#faf5ff;color:#a855f7;">✍️</div><h3>توقيع PDF</h3><p>إضافة توقيعك إلى ملف PDF بسهولة.</p></div>
    <div class="card" onclick="goPage('encrypt')"><div class="icon-box" style="background:#f8fafc;color:#475569;">🔐</div><h3>تشفير PDF</h3><p>حماية ملفاتك بكلمة مرور قوية.</p></div>
  </div>
</div>

<!-- AI TOOLS -->
<div class="page" id="page-aitools">
  <div class="page-title text-center">
    <span class="ai-badge">AI Powered</span>
    <h1>أدوات الذكاء الاصطناعي</h1>
    <p>أدوات متقدمة تعيد تعريف كيفية تعاملك مع مستندات PDF</p>
  </div>
  <div class="grid3">
    <div class="card" onclick="goPage('summarize')"><div class="icon-box" style="background:#eff6ff;color:#3b82f6;">🧠</div><h3>التلخيص الذكي</h3><p>لخص أي ملف PDF في ثوانٍ بذكاء اصطناعي.</p></div>
    <div class="card" onclick="goPage('ocr')"><div class="icon-box" style="background:#eef2ff;color:#6366f1;">🔍</div><h3>استخراج نصوص OCR</h3><p>حول الصور إلى نصوص قابلة للتعديل.</p></div>
    <div class="card" onclick="goPage('chat')"><div class="icon-box" style="background:#f0fdf4;color:#22c55e;">💬</div><h3>تحدث مع PDF</h3><p>اسأل الذكاء الاصطناعي عن محتوى الملف.</p></div>
    <div class="card" onclick="goPage('translate')"><div class="icon-box" style="background:#f0fdfa;color:#14b8a6;">🌐</div><h3>ترجمة فورية</h3><p>ترجم محتوى PDF إلى أي لغة بذكاء.</p></div>
    <div class="card" onclick="goPage('compare')"><div class="icon-box" style="background:#fffbeb;color:#f59e0b;">📑</div><h3>مقارنة الملفات</h3><p>قارن بين ملفين PDF واكتشف الفروق.</p></div>
    <div class="card" onclick="goPage('aicreate')"><div class="icon-box" style="background:#faf5ff;color:#a855f7;">✨</div><h3>إنشاء بالذكاء الاصطناعي</h3><p>أنشئ ملف PDF كامل منسق احترافياً من وصف بسيط.</p></div>
  </div>
</div>

<!-- MERGE -->
<div class="page" id="page-merge">
  <div class="tool-page">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#eff6ff;color:#3b82f6;">🗂️</div>
      <h1>دمج PDF</h1><p>دمج عدة ملفات PDF في ملف واحد بسهولة.</p>
    </div>
    <div id="merge-upload-area">
      <div class="drop-zone" id="merge-drop" onclick="document.getElementById('merge-input').click()" ondragover="dragOver(event,'merge-drop')" ondragleave="dragLeave('merge-drop')" ondrop="dropFiles(event,'merge')">
        <input type="file" id="merge-input" multiple accept="application/pdf" onchange="addFiles(event,'merge')">
        <div class="drop-icon">📂</div>
        <h3>اسحب وأفلت ملفات PDF هنا</h3>
        <p>أو انقر للاختيار — يمكنك إضافة أكثر من ملف</p>
      </div>
      <div class="file-list" id="merge-files"></div>
      <div class="action-row" id="merge-action" style="display:none;">
        <button class="btn-primary" onclick="mergePDFs()">🗂️ دمج الملفات</button>
      </div>
    </div>
    <div id="merge-result" style="display:none;"></div>
  </div>
</div>

<!-- SPLIT -->
<div class="page" id="page-split">
  <div class="tool-page">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#eef2ff;color:#6366f1;">✂️</div>
      <h1>تقسيم PDF</h1><p>فصل صفحة أو نطاق من ملف PDF.</p>
    </div>
    <div class="drop-zone" onclick="document.getElementById('split-input').click()">
      <input type="file" id="split-input" accept="application/pdf" onchange="loadSplit(event)">
      <div class="drop-icon">📄</div><h3>اختر ملف PDF للتقسيم</h3>
    </div>
    <div class="section-card" id="split-options" style="display:none;">
      <h3>خيارات التقسيم</h3>
      <div class="form-group"><label>من صفحة</label><input type="number" id="split-from" value="1" min="1"></div>
      <div class="form-group"><label>إلى صفحة</label><input type="number" id="split-to" placeholder="..."></div>
      <p style="font-size:13px;color:var(--muted);margin-top:8px;" id="split-info"></p>
      <div class="action-row"><button class="btn-primary" onclick="splitPDF()">✂️ تقسيم</button></div>
    </div>
    <div id="split-result"></div>
  </div>
</div>

<!-- COMPRESS -->
<div class="page" id="page-compress">
  <div class="tool-page">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#f0fdf4;color:#22c55e;">📦</div>
      <h1>ضغط PDF</h1><p>تقليل حجم ملف PDF مع الحفاظ على الجودة.</p>
    </div>
    <div class="info-box">⚠️ الضغط يُزيل البيانات الوصفية والخطوط الزائدة لتخفيف الحجم.</div>
    <div class="drop-zone" onclick="document.getElementById('compress-input').click()">
      <input type="file" id="compress-input" accept="application/pdf" onchange="loadCompress(event)">
      <div class="drop-icon">📦</div><h3>اختر ملف PDF للضغط</h3>
    </div>
    <div id="compress-info" style="display:none;" class="section-card">
      <h3 id="compress-filename"></h3>
      <p id="compress-size" style="color:var(--muted);font-size:13px;margin-bottom:12px;"></p>
      <div class="action-row"><button class="btn-primary" onclick="compressPDF()">📦 ضغط الملف</button></div>
    </div>
    <div id="compress-result"></div>
  </div>
</div>

<!-- VIEW -->
<div class="page" id="page-view">
  <div class="tool-page" style="max-width:900px;">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#ecfeff;color:#06b6d4;">👁️</div>
      <h1>عرض PDF</h1><p>تصفح ملفات PDF داخل المتصفح.</p>
    </div>
    <div class="drop-zone" onclick="document.getElementById('view-input').click()" id="view-drop">
      <input type="file" id="view-input" accept="application/pdf" onchange="loadPDFView(event)">
      <div class="drop-icon">👁️</div><h3>اختر ملف PDF للعرض</h3>
    </div>
    <div id="view-controls" style="display:none;"></div>
  </div>
</div>

<!-- CREATE — الأداة المحدّثة -->
<div class="page" id="page-create">
  <div class="tool-page">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#f0fdfa;color:#14b8a6;">➕</div>
      <h1>إنشاء PDF</h1>
      <p>إنشاء ملف PDF احترافي من نص — أو دعِ الذكاء الاصطناعي ينسّقه بشكل رائع</p>
    </div>
    <div class="section-card">
      <div class="form-group">
        <label>عنوان المستند</label>
        <input type="text" id="create-title" placeholder="عنوان...">
      </div>
      <div class="form-group">
        <label>المحتوى</label>
        <textarea id="create-content" rows="10" placeholder="اكتب محتوى المستند هنا..."></textarea>
      </div>
      <div class="form-row">
        <div class="form-group" style="margin-bottom:0">
          <label>نوع الخط</label>
          <select id="create-font">
            <option value="Cairo">Cairo (عربي)</option>
            <option value="Tajawal">Tajawal (عربي)</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>حجم الخط</label>
          <select id="create-fontsize">
            <option value="11">صغير — 11px</option>
            <option value="13" selected>متوسط — 13px</option>
            <option value="15">كبير — 15px</option>
            <option value="18">كبير جداً — 18px</option>
          </select>
        </div>
      </div>
      <div class="action-row" style="gap:10px;flex-wrap:wrap;justify-content:flex-start;">
        <button class="btn-primary" onclick="createPDF()">➕ إنشاء PDF عادي</button>
        <button class="btn-ai" onclick="aiFormatAndCreate()" id="btn-ai-format">
          <span class="btn-ai-icon">✨</span>
          <span>تنسيق احترافي بالـ AI</span>
        </button>
      </div>
      <p style="font-size:11px;color:var(--muted);margin-top:10px;padding-right:4px;">
        💡 <strong>إنشاء عادي:</strong> بدون إنترنت &nbsp;|&nbsp; <strong>✨ تنسيق AI:</strong> يجمّل ويرتّب المحتوى باستخدام الذكاء الاصطناعي
      </p>
    </div>
    <div id="create-result"></div>
  </div>
</div>

<!-- NUMBER -->
<div class="page" id="page-number">
  <div class="tool-page">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#fdf4ff;color:#d946ef;">🔢</div>
      <h1>ترقيم الصفحات</h1><p>إضافة أرقام الصفحات إلى ملف PDF.</p>
    </div>
    <div class="drop-zone" onclick="document.getElementById('number-input').click()">
      <input type="file" id="number-input" accept="application/pdf" onchange="loadNumber(event)">
      <div class="drop-icon">🔢</div><h3>اختر ملف PDF</h3>
    </div>
    <div id="number-options" style="display:none;" class="section-card">
      <h3>خيارات الترقيم</h3>
      <div class="form-row">
        <div class="form-group"><label>الموضع</label>
          <select id="number-pos">
            <option value="bottom-center">أسفل - وسط</option>
            <option value="bottom-right">أسفل - يمين</option>
            <option value="bottom-left">أسفل - يسار</option>
            <option value="top-center">أعلى - وسط</option>
          </select>
        </div>
        <div class="form-group"><label>البداية من</label><input type="number" id="number-start" value="1" min="1"></div>
      </div>
      <div class="action-row"><button class="btn-primary" onclick="numberPDF()">🔢 إضافة الأرقام</button></div>
    </div>
    <div id="number-result"></div>
  </div>
</div>

<!-- SIGN -->
<div class="page" id="page-sign">
  <div class="tool-page">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#faf5ff;color:#a855f7;">✍️</div>
      <h1>التوقيع الرقمي</h1><p>ارسم توقيعك واحفظه كصورة.</p>
    </div>
    <div class="section-card">
      <h3>ارسم توقيعك</h3>
      <canvas id="sig-canvas" width="700" height="200"></canvas>
      <div class="action-row" style="margin-top:12px;">
        <button class="btn-secondary" onclick="clearSig()">🗑️ مسح</button>
        <button class="btn-primary" onclick="saveSig()">💾 حفظ التوقيع</button>
      </div>
    </div>
    <div id="sig-preview" style="display:none;" class="section-card text-center">
      <h3>معاينة التوقيع</h3>
      <img id="sig-img" style="max-width:100%;border-radius:8px;margin:12px auto;display:block;">
      <div class="action-row" style="justify-content:center;">
        <button class="btn-primary" onclick="downloadSig()">⬇️ تحميل كـ PNG</button>
      </div>
    </div>
  </div>
</div>

<!-- ENCRYPTION -->
<div class="page" id="page-encryption">
  <div class="tool-page">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#f0fdf4;color:#16a34a;">🔒</div>
      <h1>التشفير العسكري</h1><p>تشفير AES-256-GCM حقيقي — خارج المتصفح تماماً.</p>
    </div>
    <div class="enc-badge">🛡️ AES-256-GCM · PBKDF2 · 310,000 iter</div>
    <div class="section-card">
      <div class="form-group"><label>اختر ملفاً للتشفير</label><input type="file" id="enc-file" style="padding:8px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);width:100%;font-family:inherit;"></div>
      <div class="form-group">
        <label>كلمة المرور</label>
        <input type="text" id="enc-pass" placeholder="أدخل كلمة مرور قوية...">
        <div class="strength-bar-wrap" id="strength-bars">
          <div class="strength-seg" id="s1"></div><div class="strength-seg" id="s2"></div>
          <div class="strength-seg" id="s3"></div><div class="strength-seg" id="s4"></div>
        </div>
        <p id="strength-label" style="font-size:12px;color:var(--muted);margin-top:4px;"></p>
      </div>
      <div class="action-row"><button class="btn-primary" onclick="encryptFile()">🔒 تشفير الملف</button></div>
    </div>
    <div class="section-card" style="margin-top:16px;">
      <h3>فك التشفير</h3>
      <div class="form-group"><label>ملف مشفّر (.enc)</label><input type="file" id="dec-file" style="padding:8px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);width:100%;font-family:inherit;"></div>
      <div class="form-group"><label>كلمة المرور</label><input type="text" id="dec-pass" placeholder="كلمة المرور..."></div>
      <div class="action-row"><button class="btn-primary" onclick="decryptFile()">🔓 فك التشفير</button></div>
    </div>
    <div id="enc-result"></div>
  </div>
</div>

<!-- ENCRYPT -->
<div class="page" id="page-encrypt">
  <div class="tool-page">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#f8fafc;color:#475569;">🔐</div>
      <h1>تشفير PDF</h1><p>أضف كلمة مرور لحماية ملفك.</p>
    </div>
    <div class="drop-zone" onclick="document.getElementById('encpdf-input').click()">
      <input type="file" id="encpdf-input" accept="application/pdf" onchange="loadEncPdf(event)">
      <div class="drop-icon">🔐</div><h3>اختر ملف PDF</h3>
    </div>
    <div id="encpdf-options" style="display:none;" class="section-card">
      <div class="form-group"><label>كلمة المرور</label><input type="text" id="encpdf-pass" placeholder="كلمة مرور قوية..."></div>
      <div class="action-row"><button class="btn-primary" onclick="encryptPDF()">🔐 تشفير</button></div>
    </div>
    <div id="encpdf-result"></div>
  </div>
</div>

<!-- ORGANIZE -->
<div class="page" id="page-organize">
  <div class="tool-page" style="max-width:900px;">
    <div class="tool-header">
      <div class="tool-icon-lg" style="background:#f0f9ff;color:#0ea5e9;">🗂️</div>
      <h1>تنظيم الصفحات</h1><p>رتّب صفحات PDF واحذف ما تريد.</p>
    </div>
    <div class="drop-zone" onclick="document.getElementById('org-input').click()" id="org-drop">
      <input type="file" id="org-input" accept="application/pdf" onchange="loadOrganize(event)">
      <div class="drop-icon">🗂️</div><h3>اختر ملف PDF</h3>
    </div>
    <div id="org-area" style="display:none;">
      <div class="section-card">
        <h3>صفحات الملف — اسحب لإعادة الترتيب | انقر ✖ للحذف</h3>
        <div class="thumb-grid" id="org-grid"></div>
        <div class="action-row"><button class="btn-primary" onclick="applyOrganize()">💾 حفظ الترتيب الجديد</button></div>
      </div>
    </div>
    <div id="org-result"></div>
  </div>
</div>

<!-- TEMPLATES -->
<div class="page" id="page-templates">
  <div class="page-title text-center">
    <h1>القوالب الجاهزة</h1><p>اختر قالباً وعدّل عليه مباشرة</p>
  </div>
  <div class="grid3">
    <div class="card" onclick="useTemplate('cv')"><div class="icon-box" style="background:#eff6ff;color:#3b82f6;">📋</div><h3>السيرة الذاتية</h3><p>قالب سيرة ذاتية احترافي جاهز للتخصيص.</p></div>
    <div class="card" onclick="useTemplate('invoice')"><div class="icon-box" style="background:#f0fdf4;color:#22c55e;">🧾</div><h3>الفاتورة التجارية</h3><p>فاتورة تجارية احترافية قابلة للتعديل.</p></div>
    <div class="card" onclick="useTemplate('letter')"><div class="icon-box" style="background:#fdf4ff;color:#d946ef;">📝</div><h3>الخطاب الرسمي</h3><p>خطاب رسمي بتنسيق مناسب للمراسلات.</p></div>
    <div class="card" onclick="useTemplate('report')"><div class="icon-box" style="background:#fff7ed;color:#f97316;">📊</div><h3>تقرير عمل</h3><p>قالب تقرير عمل منظّم وواضح.</p></div>
    <div class="card" onclick="useTemplate('contract')"><div class="icon-box" style="background:#f0fdfa;color:#14b8a6;">📃</div><h3>عقد عمل</h3><p>عقد عمل قانوني جاهز للتخصيص.</p></div>
    <div class="card" onclick="useTemplate('proposal')"><div class="icon-box" style="background:#faf5ff;color:#a855f7;">💡</div><h3>عرض مشروع</h3><p>قالب عرض تقديمي لمشروعك.</p></div>
  </div>
  <div id="template-editor" style="display:none;" class="section-card">
    <h3 id="template-title"></h3>
    <textarea id="template-content" rows="12"></textarea>
    <div class="action-row">
      <button class="btn-primary" onclick="exportTemplate()">⬇️ تصدير كـ PDF</button>
    </div>
  </div>
</div>

<!-- SUMMARIZE -->
<div class="page" id="page-summarize">
  <div class="tool-page">
    <div class="tool-header">
      <span class="ai-badge">AI · Gemini</span>
      <div class="tool-icon-lg" style="background:#eff6ff;color:#3b82f6;">🧠</div>
      <h1>التلخيص الذكي</h1><p>لخص أي ملف PDF في ثوانٍ باستخدام الذكاء الاصطناعي.</p>
    </div>
    <div class="drop-zone" onclick="document.getElementById('sum-input').click()" id="sum-dz">
      <input type="file" id="sum-input" accept="application/pdf" onchange="handleSumFile(this.files[0])">
      <div class="drop-icon">📄</div>
      <h3>ارفع ملف PDF للتلخيص</h3>
      <p>يستخرج الذكاء الاصطناعي النقاط الرئيسية في ثوانٍ</p>
    </div>
    <div id="sum-file-info" style="display:none;" class="section-card">
      <h3 id="sum-file-name"></h3>
      <div class="form-group" style="margin-top:12px;">
        <label>نوع التلخيص</label>
        <select id="sum-type">
          <option value="short">ملخص قصير (نقاط رئيسية)</option>
          <option value="detailed">ملخص تفصيلي</option>
          <option value="bullets">نقاط مُرقَّمة</option>
        </select>
      </div>
      <div class="action-row"><button class="btn-primary" onclick="runSummarize()">🧠 تلخيص الآن</button></div>
    </div>
    <div id="sum-result"></div>
  </div>
</div>

<!-- OCR -->
<div class="page" id="page-ocr">
  <div class="tool-page">
    <div class="tool-header">
      <span class="ai-badge">Tesseract.js</span>
      <div class="tool-icon-lg" style="background:#eef2ff;color:#6366f1;">🔍</div>
      <h1>استخراج نصوص OCR</h1><p>استخراج النصوص من الصور والملفات الممسوحة.</p>
    </div>
    <div class="info-box">⚡ يعمل محلياً في المتصفح — لا يُرفع أي ملف.</div>
    <div class="drop-zone" onclick="document.getElementById('ocr-input').click()" id="ocr-dz">
      <input type="file" id="ocr-input" accept="image/*" onchange="handleOcrFile(this.files[0])">
      <div class="drop-icon">🔍</div>
      <h3>ارفع صورة لاستخراج النص</h3>
      <p>PNG, JPG, WEBP — يدعم العربية والإنجليزية</p>
    </div>
    <div id="ocr-result"></div>
  </div>
</div>

<!-- CHAT -->
<div class="page" id="page-chat">
  <div class="tool-page">
    <div class="tool-header">
      <span class="ai-badge">AI · Gemini</span>
      <div class="tool-icon-lg" style="background:#f0fdf4;color:#22c55e;">💬</div>
      <h1>تحدث مع PDF</h1><p>اطرح أسئلة على مستنداتك واحصل على إجابات.</p>
    </div>
    <div class="drop-zone" onclick="document.getElementById('chat-input').click()" id="chat-dz">
      <input type="file" id="chat-input" accept="application/pdf" onchange="handleChatFile(this.files[0])">
      <div class="drop-icon">💬</div><h3>ارفع ملف PDF وابدأ الدردشة</h3>
    </div>
    <div id="chat-area" style="display:none;" class="section-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 id="chat-file-name" style="font-size:14px;color:var(--muted);"></h3>
        <button class="btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="resetChat()">🔄 ملف آخر</button>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-row">
        <input type="text" id="chat-q" placeholder="اسأل سؤالاً عن الملف..." onkeydown="if(event.key==='Enter')sendChatMsg()">
        <button class="btn-primary" onclick="sendChatMsg()" style="padding:10px 18px;">إرسال ➤</button>
      </div>
    </div>
  </div>
</div>

<!-- TRANSLATE -->
<div class="page" id="page-translate">
  <div class="tool-page">
    <div class="tool-header">
      <span class="ai-badge">AI · Gemini</span>
      <div class="tool-icon-lg" style="background:#f0fdfa;color:#14b8a6;">🌐</div>
      <h1>ترجمة فورية</h1><p>ترجم محتوى PDF إلى أي لغة.</p>
    </div>
    <div class="drop-zone" onclick="document.getElementById('tr-input').click()" id="tr-dz">
      <input type="file" id="tr-input" accept="application/pdf" onchange="handleTrFile(this.files[0])">
      <div class="drop-icon">🌐</div><h3>ارفع ملف PDF للترجمة</h3>
    </div>
    <div id="tr-options" style="display:none;" class="section-card">
      <h3 id="tr-file-name"></h3>
      <div class="form-group" style="margin-top:12px;">
        <label>ترجم إلى</label>
        <select id="tr-lang">
          <option value="العربية">العربية</option>
          <option value="English">English</option>
          <option value="Français">Français</option>
          <option value="Español">Español</option>
          <option value="Deutsch">Deutsch</option>
          <option value="中文">中文</option>
        </select>
      </div>
      <div class="action-row"><button class="btn-primary" onclick="runTranslate()">🌐 ترجمة الآن</button></div>
    </div>
    <div id="tr-result"></div>
  </div>
</div>

<!-- COMPARE -->
<div class="page" id="page-compare">
  <div class="tool-page">
    <div class="tool-header">
      <span class="ai-badge">AI · Gemini</span>
      <div class="tool-icon-lg" style="background:#fffbeb;color:#f59e0b;">📑</div>
      <h1>مقارنة الملفات</h1><p>قارن بين ملفين PDF واكتشف الفروق.</p>
    </div>
    <div class="form-row">
      <div>
        <div class="drop-zone" onclick="document.getElementById('cmp-input1').click()" style="padding:30px 20px;">
          <input type="file" id="cmp-input1" accept="application/pdf" onchange="handleCmpFile(this.files[0],1)">
          <div class="drop-icon" style="font-size:28px;">📄</div>
          <h3 style="font-size:14px;">الملف الأول</h3>
          <p id="cmp-name1" style="color:var(--blue);font-size:12px;margin-top:6px;"></p>
        </div>
      </div>
      <div>
        <div class="drop-zone" onclick="document.getElementById('cmp-input2').click()" style="padding:30px 20px;">
          <input type="file" id="cmp-input2" accept="application/pdf" onchange="handleCmpFile(this.files[0],2)">
          <div class="drop-icon" style="font-size:28px;">📄</div>
          <h3 style="font-size:14px;">الملف الثاني</h3>
          <p id="cmp-name2" style="color:var(--blue);font-size:12px;margin-top:6px;"></p>
        </div>
      </div>
    </div>
    <div class="action-row" id="cmp-action" style="display:none;">
      <button class="btn-primary" onclick="runCompare()">📑 مقارنة الآن</button>
    </div>
    <div id="cmp-result"></div>
  </div>
</div>

<!-- AI CREATE -->
<div class="page" id="page-aicreate">
  <div class="tool-page">
    <div class="tool-header">
      <span class="ai-badge">AI · Gemini</span>
      <div class="tool-icon-lg" style="background:#faf5ff;color:#a855f7;">✨</div>
      <h1>إنشاء بالذكاء الاصطناعي</h1>
      <p>أنشئ ملف PDF منسق بشكل احترافي وفريد من وصف بسيط.</p>
    </div>
    <div class="section-card">
      <div class="form-group">
        <label>اوصف الملف الذي تريد إنشاءه</label>
        <textarea id="aicreate-desc" rows="5" placeholder="مثال: أنشئ لي تقرير عمل أسبوعي يشمل الإنجازات والتحديات وخطة الأسبوع القادم..."></textarea>
      </div>
      <div class="form-group">
        <label>نوع المستند</label>
        <select id="aic-type">
          <option value="report">تقرير</option>
          <option value="letter">خطاب رسمي</option>
          <option value="proposal">عرض مشروع</option>
          <option value="summary">ملخص</option>
          <option value="plan">خطة عمل</option>
          <option value="cv">سيرة ذاتية</option>
          <option value="other">آخر</option>
        </select>
      </div>
      <div class="action-row">
        <button class="btn-ai" onclick="runAiCreate()" id="btn-aic-run">
          <span class="btn-ai-icon">✨</span>
          <span>إنشاء وتنسيق احترافي</span>
        </button>
      </div>
    </div>
    <div id="aic-result"></div>
  </div>
</div>

</main>
<footer>
  <span>GeneralPDF © 2025 — جميع العمليات تتم في متصفحك محلياً</span>
</footer>
<div id="toast"></div>

`;
fs.writeFileSync('part2.txt', part2);

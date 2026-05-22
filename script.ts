import fs from 'fs';

const htmlStr = fs.readFileSync('index.html', 'utf-8');

let content = htmlStr;

// 1. Add script to head
content = content.replace("</head>", '  <script type="module" src="/src/main.tsx"></script>\n</head>');

// 2. Modifying CSS
const css_new = `:root {
    --bg: #0f172a; --text: #f8fafc; --muted: #94a3b8; --border: rgba(255,255,255,0.1);
    --card: rgba(255,255,255,0.05); --blue: #3b82f6; --blue-h: #60a5fa; --header: rgba(15,23,42,0.6); --footer: transparent;
  }
  .dark {
    --bg: #0f172a; --text: #f8fafc; --muted: #94a3b8; --border: rgba(255,255,255,0.1);
    --card: rgba(255,255,255,0.05); --blue: #3b82f6; --blue-h: #60a5fa; --header: rgba(15,23,42,0.6); --footer: transparent;
  }
  .card, .drop-zone, .section-card, nav, header { backdrop-filter: blur(16px); }
  .frosted-bg-1 { position: fixed; top: -100px; left: -100px; width: 400px; height: 400px; background: rgba(37, 99, 235, 0.2); border-radius: 50%; filter: blur(120px); z-index: -1; pointer-events: none; }
  .frosted-bg-2 { position: fixed; bottom: -50px; right: -50px; width: 500px; height: 500px; background: rgba(147, 51, 234, 0.2); border-radius: 50%; filter: blur(150px); z-index: -1; pointer-events: none; }`;

content = content.replace(/:root\s*\{[^}]+\}\s*\.dark\s*\{[^}]+\}/, css_new);

// 3. Add frosted bg to body
content = content.replace("<body>", '<body>\n<div class="frosted-bg-1"></div>\n<div class="frosted-bg-2"></div>');

// 4. Replace header-btns
const header_to_replace = `<div class="header-btns">
    <button class="icon-btn" onclick="toggleLang()">🌐 <span id="langBtn">EN</span></button>
    <button class="icon-btn" onclick="toggleTheme()"><span id="themeIcon">🌙</span></button>
  </div>`;
content = content.replace(header_to_replace, '<div class="header-btns" id="auth-container"></div>');

// 5. Remove API Key Modal
const modal_regex = /<!-- API Key Modal -->.*?<div class="modal-overlay" id="apiKeyModal" style="display:none;">.*?<\/div>\n<\/div>/s;
content = content.replace(modal_regex, '');

// 6. Replace callGemini
const new_callGemini = `async function callGemini(prompt, maxTokens=2000) {
  if (!window.currentUser) {
    showToast('❌ يجب تسجيل الدخول عبر حساب جوجل أولاً');
    throw new Error('غير مصرح - الرجاء تسجيل الدخول.');
  }

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || \`HTTP \${res.status}\`);
  }
  const data = await res.json();
  return data.result || '';
}`;
content = content.replace(/async function callGemini\(prompt,maxTokens=2000\)\{.*?\n\}/s, new_callGemini);

// 7. Replace saveFile
const old_saveFile = "function saveFile(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}";
const new_saveFile = `function saveFile(blob, name) {
  const url = URL.createObjectURL(blob);
  if (window.median && window.median.open) {
      window.median.open.browser({url: url});
  } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}`;
content = content.replace(old_saveFile, new_saveFile);

// 8. Add saveFileHistory
content = content.replace("function handleSumFile(file){if(!file)return;sumFile=file;", "function handleSumFile(file){if(!file)return;sumFile=file;\\n  if(window.saveFileHistory) window.saveFileHistory(file.name, 'أداة التلخيص الذكي');");
content = content.replace("async function handleSplitFile(file){", "async function handleSplitFile(file){\\n  if(!file)return;splitFile=file;\\n  if(window.saveFileHistory) window.saveFileHistory(file.name, 'أداة التقسيم');");
content = content.replace("function loadCompress(e){const f=e.target.files[0];if(!f)return;compressFile=f;", "function loadCompress(e){const f=e.target.files[0];if(!f)return;compressFile=f;\\n  if(window.saveFileHistory) window.saveFileHistory(f.name, 'أداة الضغط');");
content = content.replace("const file=e.target.files[0];if(!file)return;\\n  const url=URL.createObjectURL", "const file=e.target.files[0];if(!file)return;\\n  if(window.saveFileHistory) window.saveFileHistory(file.name, 'أداة العرض');\\n  const url=URL.createObjectURL");
content = content.replace("function loadNumber(e){numberFile=e.target.files[0];", "function loadNumber(e){numberFile=e.target.files[0];\\n  if(numberFile && window.saveFileHistory) window.saveFileHistory(numberFile.name, 'أداة الترقيم');");
content = content.replace("function loadEncPdf(e){encpdfFile=e.target.files[0];", "function loadEncPdf(e){encpdfFile=e.target.files[0];\\n  if(encpdfFile && window.saveFileHistory) window.saveFileHistory(encpdfFile.name, 'أداة التشفير');");
content = content.replace("function loadOrganize(e){orgFile=e.target.files[0];", "function loadOrganize(e){orgFile=e.target.files[0];\\n  if(orgFile && window.saveFileHistory) window.saveFileHistory(orgFile.name, 'أداة التنظيم');");
content = content.replace("async function handleOcrFile(file){\\n  if(!file)return;", "async function handleOcrFile(file){\\n  if(!file)return;\\n  if(window.saveFileHistory) window.saveFileHistory(file.name, 'أداة OCR');");
content = content.replace("function handleChatFile(file){if(!file)return;chatFile=file;", "function handleChatFile(file){if(!file)return;chatFile=file;\\n  if(window.saveFileHistory) window.saveFileHistory(file.name, 'الدردشة مع PDF');");
content = content.replace("function handleTrFile(file){if(!file)return;trFile=file;", "function handleTrFile(file){if(!file)return;trFile=file;\\n  if(window.saveFileHistory) window.saveFileHistory(file.name, 'أداة الترجمة');");
content = content.replace("if(n===1){cmpFile1=file;", "if(n===1){cmpFile1=file; if(window.saveFileHistory) window.saveFileHistory(file.name, 'أداة المقارنة'); ");
content = content.replace("else{cmpFile2=file;", "else{cmpFile2=file; if(window.saveFileHistory) window.saveFileHistory(file.name, 'أداة المقارنة'); ");
content = content.replace("const file=fi.files[0];const buf=await file.arrayBuffer();", "const file=fi.files[0]; if(window.saveFileHistory) window.saveFileHistory(file.name, 'التشفير العسكري'); const buf=await file.arrayBuffer();");
content = content.replace("const buf=await fi.files[0].arrayBuffer();", "const buf=await fi.files[0].arrayBuffer(); if(window.saveFileHistory) window.saveFileHistory(fi.files[0].name, 'فك التشفير العسكري');");

content = content.replace("files.forEach(f=>{if(!mergeFilesList.find(x=>x.name===f.name))mergeFilesList.push(f);})", "files.forEach(f=>{if(!mergeFilesList.find(x=>x.name===f.name)){mergeFilesList.push(f); if(window.saveFileHistory) window.saveFileHistory(f.name, 'أداة الدمج');}})");

// 9. Clean up 'openApiModal' calls
content = content.replace(/if\(!getApiKey\(\)\)\{openApiModal\('[^']+'\);return;\}/g, "");
content = content.replace(/if \(!getApiKey\(\)\) \{ openApiModal\('aicreate'\); return; \}/g, "");

// Remove key indicator elements, since they aren't needed anymore
// regex like <div style="...">...<span class="key-indicator"...>...</span>...</div>
content = content.replace(/<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">\s*<span class="key-indicator"[^>]*>.*?<\/span>\s*<\/div>/g, '');

fs.writeFileSync('index.html', content);

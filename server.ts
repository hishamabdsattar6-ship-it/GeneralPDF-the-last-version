import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateAiPrompt } from './lib/validators.js';

import { extractTextPipeline } from './src/lib/pdfPipeline.js';
import { vectorizeAndStore } from './src/lib/ragVectorStore.js';
import { answerQuestionWithRAG } from './src/lib/geminiCaching.js';

const app = express();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: 'uploads/' }); // multer configuration


const ALLOWED_ORIGINS = [
  'https://your-domain.vercel.app', 
  'http://localhost:3000',
  process.env.VITE_APP_URL || '' // assuming dynamic origins can be added here
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.includes('run.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS غير مسموح'));
    }
  }
}));

app.use(express.json({ limit: '1mb' })); // Limit body size to 1MB

// 1. Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "worker-src 'self' blob:",
      "connect-src 'self' https://generativelanguage.googleapis.com blob: https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com",
    ].join('; ')
  );
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// 2. Rate Limiting
const rateLimitMap = new Map();
app.use('/api/', (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30;

  const userData = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > userData.resetTime) {
    userData.count = 0;
    userData.resetTime = now + windowMs;
  }

  userData.count++;
  rateLimitMap.set(ip, userData);

  if (rateLimitMap.size > 10000) rateLimitMap.clear();

  if (userData.count > maxRequests) {
    res.setHeader('Retry-After', '60');
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', '0');
    return res.status(429).json({ error: 'طلبات كثيرة جداً، حاول لاحقاً' });
  }

  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(maxRequests - userData.count));
  next();
});

// 3. Block Sensitive Paths
app.use((req, res, next) => {
  const blockedPaths = ['/.env', '/config', '/.git'];
  if (blockedPaths.some(bp => req.path.startsWith(bp))) {
    return res.status(403).json({ error: 'غير مسموح' });
  }
  next();
});

// Initialize Gemini backend-side
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/api/gemini', async (req, res) => {
  try {
    const contentType = req.headers['content-type'];
    if (!contentType?.includes('application/json')) {
      return res.status(415).json({ error: 'Content-Type غير صحيح' });
    }

    const { prompt, maxTokens } = req.body;
    const cleanPrompt = validateAiPrompt(prompt);
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: cleanPrompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens || 2000,
      }
    });

    const response = await result.response;
    res.json({ result: response.text() });
  } catch (error: any) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: 'حدث خطأ، حاول مرة أخرى' });
  }
});

// ==========================================
// RAG Pipeline Routes
// ==========================================

// 1. مسار رفع الملف ومعالجته (Triage + OCR + Vectoring)
app.post('/api/pipeline/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'الرجاء إرفاق ملف PDF.' });
    }

    const filePath = req.file.path;
    const documentId = `doc-${Date.now()}`;

    // بدء خط الإنتاج لاستخراج النص الكامل
    const fullText = await extractTextPipeline(filePath);

    // تحويل النص إلى متجهات وتخزينه في Pinecone
    await vectorizeAndStore(fullText, documentId);

    // مسح الملف المؤقت من Node.js
    fs.unlinkSync(filePath);

    res.json({ success: true, documentId, message: 'تم معالجة الملف وتخزينه بنجاح!' });
  } catch (error: any) {
    console.error('Pipeline Upload Error:', error);
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء معالجة الملف' });
  }
});

// 2. مسار الإجابة السريعة (Context Retrieval)
app.post('/api/pipeline/ask', async (req, res) => {
  try {
    const { documentId, question } = req.body;
    
    if (!documentId || !question) {
      return res.status(400).json({ error: 'يرجى توفير documentId والسؤال.' });
    }

    // استرداد السياق وصياغة الإجابة باستخدام RAG
    const answer = await answerQuestionWithRAG(question, documentId);

    res.json({ answer });
  } catch (error: any) {
    console.error('Pipeline Ask Error:', error);
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء الاستعلام' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  app.listen(3000, '0.0.0.0', () => console.log('Server running on 3000'));
}
startServer();

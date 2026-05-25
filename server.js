/// <reference path="./src/global.d.ts" />
import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { getGemini, handleGeminiError } from './src/lib/gemini.js';
import { validateAiPrompt } from './lib/validators.js';
import { extractTextPipeline } from './src/lib/pdfPipeline.js';
import { vectorizeAndStore } from './src/lib/ragVectorStore.js';
import { answerQuestionWithRAG } from './src/lib/geminiCaching.js';
import { upsertUser, getUserById, saveFileHistory, getFileHistory } from './src/lib/db.js';
const app = express();
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir }); // multer configuration
const ALLOWED_ORIGINS = [
    'https://your-domain.vercel.app',
    'http://localhost:3000',
    process.env.VITE_APP_URL || '' // assuming dynamic origins can be added here
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.includes('run.app') || origin.endsWith('.vercel.app')) {
            callback(null, true);
        }
        else {
            callback(new Error('CORS غير مسموح: ' + origin));
        }
    }
}));
app.use(express.json({ limit: '1mb' })); // Limit body size to 1MB
app.use(cookieParser());
// 1. Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "worker-src 'self' blob:",
        "connect-src 'self' https://generativelanguage.googleapis.com blob: https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com",
    ].join('; '));
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
    if (rateLimitMap.size > 10000)
        rateLimitMap.clear();
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
app.post('/api/gemini', async (req, res) => {
    try {
        const contentType = req.headers['content-type'];
        if (!contentType?.includes('application/json')) {
            return res.status(415).json({ error: 'Content-Type غير صحيح' });
        }
        const { prompt, maxTokens } = req.body;
        const cleanPrompt = validateAiPrompt(prompt);
        const ai = getGemini();
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: cleanPrompt }] }],
            config: {
                maxOutputTokens: 8192,
            }
        });
        res.json({ result: result.text || '' });
    }
    catch (error) {
        const friendlyError = handleGeminiError(error);
        res.status(500).json({ error: friendlyError.message });
    }
});
// ==========================================
// OCR Endpoint (Supports PDF and Images with Arabic support via Gemini)
// ==========================================
app.post('/api/ocr', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'الرجاء إرفاق ملف للـ OCR (صورة أو PDF).' });
        }
        const filePath = req.file.path;
        const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
        let extractedText = '';
        if (isPdf) {
            // PDF (Triage uses pdf-parse, if scanned uses Gemini 3.5 OCR)
            extractedText = await extractTextPipeline(filePath);
        }
        else {
            // Image (Use Gemini-3.5-flash for perfect Arabic/English OCR)
            const dataBuffer = fs.readFileSync(filePath);
            const base64Data = dataBuffer.toString('base64');
            const ai = getGemini();
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: req.file.mimetype || 'image/jpeg'
                        }
                    },
                    { text: "أنت خبير OCR دقيق جداً وملتزم بنقل النص كما هو بالتفصيل. استخرج جميع النصوص من هذه الصورة بدقة متناهية كما هي وبأكملها، سواء كانت باللغة العربية أو الإنجليزية. لا تضف أي تعليقات توضيحية، ولا تقم بتلخيص أو حذف أي شيء من النص. فقط أرجع النص الأصلي بالكامل وبنفس التنسيق." }
                ]
            });
            extractedText = result.text || '';
        }
        // Clean up uploaded file
        try {
            fs.unlinkSync(filePath);
        }
        catch (e) {
            console.error('Failed to delete temp file:', e);
        }
        res.json({ text: extractedText });
    }
    catch (error) {
        // try to delete temp file if still there
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            }
            catch (e) { }
        }
        const friendlyError = handleGeminiError(error);
        res.status(500).json({ error: friendlyError.message });
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
    }
    catch (error) {
        const friendlyError = handleGeminiError(error);
        res.status(500).json({ error: friendlyError.message });
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
    }
    catch (error) {
        const friendlyError = handleGeminiError(error);
        res.status(500).json({ error: friendlyError.message });
    }
});
// ==========================================
// Auth Routes (Google OAuth)
// ==========================================
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
app.get('/api/config', (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || ''
    });
});
app.post('/api/auth/google', async (req, res) => {
    const { credential, firebaseUid } = req.body;
    if (!credential) {
        return res.status(400).json({ error: 'Token is missing' });
    }
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({ error: 'Invalid token payload' });
        }
        const { sub: id, name, email, picture } = payload;
        if (!id || !name || !email) {
            return res.status(400).json({ error: 'Incomplete user data from Google' });
        }
        const userId = firebaseUid || id;
        const user = { id: userId, name, email, picture: picture || '' };
        // حفظ أو تحديث بيانات المستخدم في قاعدة البيانات
        upsertUser(user);
        // إنشاء جلسة (JWT)
        const jwtSecret = process.env.JWT_SECRET || 'default_secret_for_development_only';
        const sessionToken = jwt.sign({ userId }, jwtSecret, { expiresIn: '7d' });
        // إعداد الكوكيز 
        res.cookie('session', sessionToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 أيام
        });
        res.json({ success: true, user });
    }
    catch (error) {
        console.error('Google Auth Error:', error.message);
        res.status(401).json({ error: 'فشل التحقق من Google Token' });
    }
});
app.post('/api/auth/demo', async (req, res) => {
    try {
        const { firebaseUid } = req.body;
        const userId = firebaseUid || 'demo-user-id';
        const demoUser = {
            id: userId,
            name: 'مستخدم تجريبي',
            email: firebaseUid ? `${firebaseUid}@internal.pdfsmart.com` : 'demo@internal.pdfsmart.com',
            picture: 'https://lh3.googleusercontent.com/a/default-user'
        };
        upsertUser(demoUser);
        const jwtSecret = process.env.JWT_SECRET || 'default_secret_for_development_only';
        const sessionToken = jwt.sign({ userId: demoUser.id }, jwtSecret, { expiresIn: '7d' });
        res.cookie('session', sessionToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({ success: true, user: demoUser });
    }
    catch (error) {
        console.error('Demo login error:', error);
        res.status(500).json({ error: 'Fails to login with demo' });
    }
});
// Middleware للتحقق من الجلسة
const requireAuth = (req, res, next) => {
    const token = req.cookies.session;
    if (!token)
        return res.status(401).json({ error: 'غير مصرح' });
    try {
        const jwtSecret = process.env.JWT_SECRET || 'default_secret_for_development_only';
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'جلسة غير صالحة' });
    }
};
app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = getUserById(req.userId);
    if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    res.json({ user });
});
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('session', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.json({ success: true });
});
app.get('/api/history', requireAuth, (req, res) => {
    try {
        const historyDb = getFileHistory(req.userId);
        const history = historyDb.map(item => {
            // Parse ISO UTC string ('YYYY-MM-DD HH:MM:SS') consistently
            const d = new Date(item.timestamp.replace(' ', 'T') + 'Z');
            const seconds = Math.floor(d.getTime() / 1000);
            return {
                id: String(item.id),
                uid: item.uid,
                fileName: item.fileName,
                toolName: item.toolName,
                timestamp: { seconds }
            };
        });
        res.json({ success: true, history });
    }
    catch (error) {
        console.error("Error fetching history from SQLite:", error);
        res.status(500).json({ error: "Failed to fetch file history" });
    }
});
app.post('/api/history', requireAuth, (req, res) => {
    const { fileName, toolName } = req.body;
    if (!fileName || !toolName) {
        return res.status(400).json({ error: "fileName and toolName are required" });
    }
    try {
        saveFileHistory(req.userId, fileName, toolName);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error saving history to SQLite:", error);
        res.status(500).json({ error: "Failed to save file history" });
    }
});
async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
        app.use(vite.middlewares);
    }
    else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }
    app.listen(3000, '0.0.0.0', () => console.log('Server running on 3000'));
}
if (!process.env.VERCEL) {
    startServer();
}
export default app;

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { searchInVectorDB } from './ragVectorStore.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const cacheManager = new GoogleAICacheManager(process.env.GEMINI_API_KEY || '');

/**
 * -------------------------------------------------------------
 * أسلوب أ: التخزين المؤقت الكامل (Gemini Context Caching)
 * -------------------------------------------------------------
 * يستخدم إذا كان الملف ضخماً جداً والمستخدم سيسأل عدة أسئلة على مدار جلسة واحدة.
 * نقوم بتخزين الملف (Cache) في خوادم جوجل ليكون الاستعلام القادم لحظياً (< 2s) ورخيصاً جداً.
 */
export async function createDocumentCache(documentText: string, displayName: string = 'Large-Doc-Cache') {
  console.log('انشاء كاش جديد للمستند عبر Gemini Context Caching...');
  
  // مدة الصلاحية التلقائية للكاش (TTL) - مثلاً 60 دقيقة
  const ttlSeconds = 60 * 60; 

  const cache = await cacheManager.create({
    model: 'models/gemini-1.5-flash-002', 
    displayName: displayName,
    systemInstruction: 'أنت مساعد ذكي ومحترف، أجب من المعطيات فقط.',
    contents: [
      {
        role: 'user',
        parts: [{ text: documentText }],
      },
    ],
    ttlSeconds,
  });

  console.log(`تم الكاش بنجاح! Cache Name: ${cache.name}`);
  return cache.name; // سنحفظ هذا الاسم في الـ Frontend أو الـ DB لنستخدمه في الأسئلة التالية
}

export async function askQuestionWithCache(cacheName: string, question: string) {
  // ننشئ النموذج مع ربطه باسم الكاش الذي تم توليده
  const model = genAI.getGenerativeModelFromCachedContent(
    await cacheManager.get(cacheName)
  );

  const result = await model.generateContent(question);
  return result.response.text();
}

/**
 * -------------------------------------------------------------
 * أسلوب ب: استخدام RAG البصرية والسريعة مع Pinecone
 * -------------------------------------------------------------
 * نستدعي الأجزاء ذات الصلة فقط من قاعدة بيانات الـ Vectors
 * مفيد للملفات الكبيرة جداً للحفاظ على دقة الردود المحددة دون تشتيت النموذج بمعلومات غير ضرورية
 */
export async function answerQuestionWithRAG(question: string, fileId: string) {
  console.log('جلب السياق الذكي من Vector DB...');
  
  // 1. استرجاع الأجزاء المقتطعة المطلوبة بناءً على سؤال المستخدم
  const relevantContext = await searchInVectorDB(question, fileId);
  
  if (!relevantContext) {
    return 'لم أجد معلومات مطابقة داخل الملف لهذا السؤال.';
  }

  console.log('تم جلب السياق الخاص بالسؤال. يتم توليد الإجابة الآن...');
  
  // 2. صياغة الـ Prompt الهندسي وإرسال السياق (المحدود والمفيد) إلى النموذج 
  const prompt = `أنت مساعد خبير. بناءً على 'السياق المستخرج' التالي، أجب على سؤال المستخدم بدقة وإيجاز.
لا تذكر معلومات خارجية غير موجودة في السياق.

[السياق المستخرج من الكتاب/الملف]:
${relevantContext}

[سؤال المستخدم]:
${question}`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  
  return result.response.text();
}

import { getGemini } from './gemini.js';
import { searchInVectorDB } from './ragVectorStore.js';
/**
 * -------------------------------------------------------------
 * أسلوب أ: التخزين المؤقت الكامل (Gemini Context Caching)
 * -------------------------------------------------------------
 * يستخدم إذا كان الملف ضخماً جداً والمستخدم سيسأل عدة أسئلة على مدار جلسة واحدة.
 * نقوم بتخزين الملف (Cache) في خوادم جوجل ليكون الاستعلام القادم لحظياً (< 2s) ورخيصاً جداً.
 */
export async function createDocumentCache(documentText, displayName = 'Large-Doc-Cache') {
    console.log('انشاء كاش جديد للمستند عبر Gemini Context Caching...');
    const ai = getGemini();
    const ttlSeconds = 60 * 60;
    const cache = await ai.caches.create({
        model: 'gemini-3.5-flash',
        config: {
            displayName: displayName,
            ttl: `${ttlSeconds}s`,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: documentText }],
                },
            ],
        }
    });
    console.log(`تم الكاش بنجاح! Cache Name: ${cache.name}`);
    return cache.name; // سنحفظ هذا الاسم في الـ Frontend أو الـ DB لنستخدمه في الأسئلة التالية
}
export async function askQuestionWithCache(cacheName, question) {
    const ai = getGemini();
    const result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: question,
        config: {
            cachedContent: cacheName
        }
    });
    return result.text || '';
}
/**
 * -------------------------------------------------------------
 * أسلوب ب: استخدام RAG البصرية والسريعة مع Pinecone
 * -------------------------------------------------------------
 * نستدعي الأجزاء ذات الصلة فقط من قاعدة بيانات الـ Vectors
 * مفيد للملفات الكبيرة جداً للحفاظ على دقة الردود المحددة دون تشتيت النموذج بمعلومات غير ضرورية
 */
export async function answerQuestionWithRAG(question, fileId) {
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
    const ai = getGemini();
    const result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
    });
    return result.text || '';
}

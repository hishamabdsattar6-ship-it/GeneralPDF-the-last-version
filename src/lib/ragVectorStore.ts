import { Pinecone } from '@pinecone-database/pinecone';
import { getGemini } from './gemini.js';

let pcCache: Pinecone | null = null;
function getPinecone(): Pinecone {
  if (!pcCache) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    pcCache = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
  }
  return pcCache;
}
const indexName = 'generalpdf-index'; // يجب إنشاء هذا الـ Index سلفاً في لوحة تحكم Pinecone بأبعاد 768

// We use getGemini() lazily to access GoogleGenAI client

/**
 * دالة ذكية لتقسيم النص الطويل (Chunking) مع الاحتفاظ بالسياق الزمني (Overlap)
 * الحجم: 500 حرف (تقريباً 100-150 كلمة)، التداخل: 100 حرف
 */
export function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  let chunks: string[] = [];
  let i = 0;
  
  while (i < text.length) {
    // قطع النص لحد الحجم المطلوب
    let chunk = text.slice(i, i + Math.min(chunkSize, text.length - i));
    chunks.push(chunk);
    
    // نتقدم للأمام بالحجم المطلوب ناقص التداخل لضمان ربط الأفكار
    i += chunkSize - overlap;
  }
  return chunks;
}

/**
 * المرحلة 3: تحويل الأجزاء النصية (Chunks) إلى متجهات وتخزينها في Pinecone
 */
export async function vectorizeAndStore(text: string, fileId: string) {
  console.log(`بدء مرحلة Chunking & Vectoring للملف: ${fileId}...`);
  const chunks = chunkText(text, 500, 100);
  console.log(`تم تقسيم النص إلى ${chunks.length} أجزاء ذكية.`);
  
  const index = getPinecone().Index(indexName);
  
  // لضمان السرعة وتجنب أخطاء الـ Rate Limit سنقوم بمعالجة الأجزاء على دفعات (Batching)
  const batchSize = 100;
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchChunks = chunks.slice(i, i + batchSize);
    
    // 1. توليد المتجهات (Embeddings) عبر Gemini API دفعة واحدة
    const ai = getGemini();
    const result = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: batchChunks,
    });
    
    if (!result.embeddings) {
      throw new Error('فشل توليد المتجهات من خادم Gemini');
    }

    const vectors = batchChunks.map((chunk, idx) => {
      const embedding = result.embeddings ? result.embeddings[idx] : null;
      if (!embedding || !embedding.values) {
        throw new Error(`فشل استرجاع متجه للفرع رقم ${idx}`);
      }
      return {
        id: `${fileId}-chunk-${i + idx}`,
        values: embedding.values, // مصفوفة الأرقام التي تمثل سياق النص
        metadata: {
          fileId: fileId,
          text: chunk,      // نحفظ النص الأصلي لجلبه لاحقاً
          chunkIndex: i + idx
        }
      };
    });
    
    // 2. إرسال المتجهات دفعة واحدة لقاعدة بينات Pinecone
    // @ts-ignore - Pinecone client types can vary
    await index.upsert(vectors);
    console.log(`تم رفع دفعة المتجهات (Batch ${i / batchSize + 1}).`);
  }
  
  console.log('تم تحويل النص وتخزينه في Vector DB بنجاح.');
}

/**
 * المرحلة 4: استرجاع السياق ذو الصلة فقط (Context Retrieval)
 * مفيد جداً للإجابة السريعة ولتقليل تكلفة إرسال المستند كاملاً للنموذج كل مرة
 */
export async function searchInVectorDB(question: string, fileId: string, topK = 5): Promise<string> {
  // 1. تحويل سؤال المستخدم لمتجه
  const ai = getGemini();
  const result = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: question,
  });
  
  const queryValues = result.embeddings?.[0]?.values;
  if (!queryValues) {
    throw new Error('فشل توليد متجه لسؤال المستخدم.');
  }
  
  // 2. البحث في Pinecone عن أقرب الأجزاء ذات الصلة حصراً (Semantic Search)
  const index = getPinecone().Index(indexName);
  const queryResponse = await index.query({
    vector: queryValues,
    topK: topK, // نجلب أفضل 5 نتائج مطابقة
    includeMetadata: true,
    filter: {
      fileId: { "$eq": fileId } // نبحث فقط ضمن أجزاء هذا الملف بالتحديد
    }
  });
  
  // 3. تجميع النصوص (Context)
  const retrievedContexts = queryResponse.matches?.map(match => match.metadata?.text as string) || [];
  return retrievedContexts.join("\n\n---\n\n");
}

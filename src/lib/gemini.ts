import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  let key = process.env.GEMINI_API_KEY || '';
  
  // Clean up any potential outer quotation marks
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  } else if (key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1);
  }
  key = key.trim();

  if (!key || key === '' || key === 'MY_GEMINI_API_KEY' || key.includes('change_me')) {
    throw new Error('يرجى تهيئة مفتاح GEMINI_API_KEY بشكل صحيح في إعدادات التطبيق (Secrets) في منصة AI Studio لمتابعة التشغيل.');
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

export function handleGeminiError(error: any): Error {
  const msg = error?.message || String(error);
  console.error("Gemini API Exec Error:", msg);
  
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('key not valid')) {
    return new Error('مفتاح API الخاص بـ Gemini غير صالح أو غير معرّف بشكل صحيح. يرجى إدخال مفتاح صالح في إعدادات التطبيق (Secrets) في AI Studio.');
  }
  
  if (msg.includes('quota') || msg.includes('Quota exceeded') || msg.includes('429')) {
    return new Error('تم تجاوز حصة الاستخدام المجانية لخادم Gemini (Quota Exceeded). يرجى الانتظار دقيقة ومحاولة العملية مجدداً.');
  }

  return error instanceof Error ? error : new Error(msg);
}

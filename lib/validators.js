// تنظيف أي نص يأتي من المستخدم
export function sanitizeText(text, maxLength = 5000) {
  if (typeof text !== 'string') return '';

  return text
    .slice(0, maxLength)
    // منع XSS - إزالة HTML tags
    .replace(/<[^>]*>/g, '')
    // منع SQL injection الأساسي
    .replace(/['";\\]/g, '')
    // منع كود JavaScript
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// التحقق من أن الملف PDF حقيقي
export async function validatePdfFile(file) {
  // تحقق من النوع
  if (file.type !== 'application/pdf') {
    throw new Error('الملف يجب أن يكون PDF');
  }

  // تحقق من الحجم (50MB كحد أقصى)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('حجم الملف يتجاوز 50MB');
  }

  // تحقق من الـ magic bytes (PDF يبدأ بـ %PDF)
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isPdf =
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46;   // F

  if (!isPdf) {
    throw new Error('الملف ليس PDF صحيحاً');
  }

  return true;
}

// التحقق من أن الصورة حقيقية
export async function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('نوع الصورة غير مدعوم');
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('حجم الصورة يتجاوز 10MB');
  }

  return true;
}

// التحقق من أن النص لا يحتوي على prompt injection
export function validateAiPrompt(prompt) {
  const maxLength = 2000;
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('الـ prompt غير صالح');
  }

  if (prompt.length > maxLength) {
    throw new Error(`الـ prompt يتجاوز ${maxLength} حرف`);
  }

  // منع محاولات اختراق الـ AI (prompt injection)
  const dangerousPatterns = [
    /ignore previous instructions/i,
    /ignore all instructions/i,
    /you are now/i,
    /forget your training/i,
    /act as/i,
    /pretend you are/i,
    /system prompt/i,
  ];

  const hasDangerous = dangerousPatterns.some(p => p.test(prompt));
  if (hasDangerous) {
    throw new Error('المحتوى غير مسموح به');
  }

  return sanitizeText(prompt, maxLength);
}

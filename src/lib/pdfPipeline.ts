import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

// إعداد خدمة Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '');

/**
 * المرحلة 1: الفحص المبدئي (File Triage)
 * الهدف: فحص الملف لمعرفة ما إذا كان نصياً (Digital) أم صور ممسوحة (Scanned)
 */
export async function triagePdf(filePath: string): Promise<{ isScanned: boolean, textLength: number, numPages: number, rawText: string }> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // استخدام مكتبة pdf-parse لاستخراج النص
    const data = await pdfParse(dataBuffer);
    
    // حساب متوسط الأحرف في كل صفحة
    const avgCharsPerPage = data.text.length / (data.numpages || 1);
    
    // إذا كان متوسط الأحرف أقل من 50 حرفاً للصفحة الواحدة، غالباً الملف مسحوب ضوئياً (Scanned)
    const isScanned = avgCharsPerPage < 50; 
    
    return {
      isScanned,
      textLength: data.text.length,
      numPages: data.numpages,
      rawText: data.text
    };
  } catch (error) {
    console.error('Triage Error:', error);
    throw new Error('فشل في فحص ملف الـ PDF');
  }
}

/**
 * المرحلة 2: المعالجة والـ OCR (للملفات الممسوحة ضوئياً)
 * الهدف: بما أن الملف Scanned، نستخدم أحدث ميزة من Google وهي File API 
 * التي تدعم رفع ملف الـ PDF مباشرة ويقوم Gemini 1.5 Flash بعمل OCR عالي الدقة (يدعم العربية والإنجليزية).
 */
export async function processScannedPdfWithGemini(filePath: string, mimeType: string = 'application/pdf'): Promise<string> {
  try {
    // 1. رفع الملف إلى Google AI File API
    // هذه الطريقة أفضل من تحويل الصفحات لصور محلياً لأنها أسرع، 
    // ومجانية مع الخطة، وتدعم الـ PDF مباشرة حتى للصفحات المتعددة!
    console.log(`جارِ رفع الملف ${filePath} إلى خوادم Gemini لعمل OCR...`);
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName: 'Scanned-Document',
    });
    
    const file = uploadResult.file;
    console.log(`تم الرفع بنجاح. URI: ${file.uri}`);
    
    // 2. استخدام نموذج 1.5 Flash السريع جداً والرخيص لاستخراج النص بدقة (OCR)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // نطلب منه استخراج النصوص بالكامل دون اختصار أو تأليف
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri
        }
      },
      { text: "أنت خبير OCR دقيق جداً. استخرج جميع النصوص من هذا الملف بدقة متناهية كما هي، سواء كانت باللغة العربية أو الإنجليزية. لا تضف أي تعليقات، ولا تقم بتلخيص أي شيء. فقط النص الأصلي." },
    ]);

    // 3. حذف الملف من خوادم جوجل بعد استخدامة للحفاظ على الخصوصية والمساحة
    await fileManager.deleteFile(file.name);
    console.log(`تم مسح الملف المؤقت من Gemini.`);

    return result.response.text();
  } catch (error) {
    console.error('OCR Processing Error:', error);
    throw new Error('عطل في معالجة الصور واستخراج النصوص (OCR)');
  }
}

/**
 * الدالة الرئيسية التي تدمج المرحلتين (1 و 2)
 */
export async function extractTextPipeline(filePath: string) {
    console.log('--- يبدأ خط إنتاج معالجة PDF ---');
    
    // 1. الفحص
    const triageInfo = await triagePdf(filePath);
    console.log(`تحديث: الملف يحتوي على ${triageInfo.numPages} صفحة.`);
    console.log(`التشخيص: الملف يعتمد على ${triageInfo.isScanned ? 'الصور (Scanned)' : 'نصوص رقمية (Digital)'}`);
    
    let finalText = "";
    
    if (triageInfo.isScanned) {
        // 2. إذا كان صورياً، نرسله لمسار الـ OCR باستخدام Gemini 1.5 Flash
        console.log('توجيه الملف إلى مسار الـ Vision و الـ OCR...');
        finalText = await processScannedPdfWithGemini(filePath);
    } else {
        // إذا كان نصياً، نستفيد من النص الذي تم استخراجه بالفعل لتوفير التكلفة والوقت!
        console.log('توجيه الملف إلى مسار النصوص السريع...');
        finalText = triageInfo.rawText;
    }
    
    console.log('--- تمت عملية الاستخراج بنجاح ---');
    return finalText;
}

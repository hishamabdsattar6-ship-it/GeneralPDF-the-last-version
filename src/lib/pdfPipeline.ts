import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Polyfills for Promise methods required by newer pdfjs-dist versions in older Node environments
if (typeof (Promise as any).withResolvers === 'undefined') {
  (Promise as any).withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof (Promise as any).try === 'undefined') {
  (Promise as any).try = function (fn: any) {
    return new Promise((resolve) => resolve(fn()));
  };
}

// Robust DOMMatrix and DOMMatrixReadOnly Polyfill for Node.js
if (typeof (global as any).DOMMatrix === 'undefined') {
  class DOMMatrixPolyfill {
    _a: number = 1;
    _b: number = 0;
    _c: number = 0;
    _d: number = 1;
    _e: number = 0;
    _f: number = 0;

    constructor(init?: any) {
      if (typeof init === 'string') {
        const match = init.match(/matrix\(([^)]+)\)/);
        if (match) {
          const vals = match[1].split(',').map(parseFloat);
          if (vals.length === 6) {
            this.a = vals[0];
            this.b = vals[1];
            this.c = vals[2];
            this.d = vals[3];
            this.e = vals[4];
            this.f = vals[5];
          }
        }
      } else if (Array.isArray(init)) {
        if (init.length === 6) {
          this.a = init[0];
          this.b = init[1];
          this.c = init[2];
          this.d = init[3];
          this.e = init[4];
          this.f = init[5];
        } else if (init.length === 16) {
          this.a = init[0]; this.b = init[1]; this.c = init[4]; this.d = init[5]; this.e = init[12]; this.f = init[13];
        }
      } else if (init && typeof init === 'object') {
        this.a = init.a ?? init.m11 ?? 1;
        this.b = init.b ?? init.m12 ?? 0;
        this.c = init.c ?? init.m21 ?? 0;
        this.d = init.d ?? init.m22 ?? 1;
        this.e = init.e ?? init.m41 ?? 0;
        this.f = init.f ?? init.m42 ?? 0;
      }
    }

    get a() { return this._a; }
    set a(val) { this._a = val; }
    get b() { return this._b; }
    set b(val) { this._b = val; }
    get c() { return this._c; }
    set c(val) { this._c = val; }
    get d() { return this._d; }
    set d(val) { this._d = val; }
    get e() { return this._e; }
    set e(val) { this._e = val; }
    get f() { return this._f; }
    set f(val) { this._f = val; }

    get m11() { return this.a; }
    set m11(v) { this.a = v; }
    get m12() { return this.b; }
    set m12(v) { this.b = v; }
    get m13() { return 0; }
    get m14() { return 0; }

    get m21() { return this.c; }
    set m21(v) { this.c = v; }
    get m22() { return this.d; }
    set m22(v) { this.d = v; }
    get m23() { return 0; }
    get m24() { return 0; }

    get m31() { return 0; }
    get m32() { return 0; }
    get m33() { return 1; }
    get m34() { return 0; }

    get m41() { return this.e; }
    set m41(v) { this.e = v; }
    get m42() { return this.f; }
    set m42(v) { this.f = v; }
    get m43() { return 0; }
    get m44() { return 1; }

    get is2D() { return true; }
    get isIdentity() {
      return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
    }

    translate(tx: number = 0, ty: number = 0, tz: number = 0) {
      const res = new DOMMatrixPolyfill();
      res.a = this.a; res.b = this.b; res.c = this.c; res.d = this.d;
      res.e = this.a * tx + this.c * ty + this.e;
      res.f = this.b * tx + this.d * ty + this.f;
      return res;
    }

    scale(sx: number = 1, sy: number = sx, sz: number = 1) {
      const res = new DOMMatrixPolyfill();
      res.a = this.a * sx; res.b = this.b * sx;
      res.c = this.c * sy; res.d = this.d * sy;
      res.e = this.e; res.f = this.f;
      return res;
    }

    multiply(other: any) {
      const res = new DOMMatrixPolyfill();
      const o = new DOMMatrixPolyfill(other);
      res.a = this.a * o.a + this.c * o.b;
      res.b = this.b * o.a + this.d * o.b;
      res.c = this.a * o.c + this.c * o.d;
      res.d = this.b * o.c + this.d * o.d;
      res.e = this.a * o.e + this.c * o.f + this.e;
      res.f = this.b * o.e + this.d * o.f + this.f;
      return res;
    }

    toString() {
      return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
    }
  }

  (global as any).DOMMatrix = DOMMatrixPolyfill;
  (global as any).DOMMatrixReadOnly = DOMMatrixPolyfill;
  (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
  (globalThis as any).DOMMatrixReadOnly = DOMMatrixPolyfill;
}

let pdfjsLib: any = null;
async function getPdfJs() {
  if (!pdfjsLib) {
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    } catch (e) {
      console.warn('Failed to import legacy pdfjs-dist', e);
      try {
        pdfjsLib = await import('pdfjs-dist');
      } catch (e2) {
        console.error('All pdfjs-dist imports failed:', e2);
        throw e2;
      }
    }
  }
  return pdfjsLib;
}

import { getGemini } from './gemini.js';

/**
 * المرحلة 1: الفحص المبدئي (File Triage)
 * الهدف: فحص الملف لمعرفة ما إذا كان نصياً (Digital) أم صور ممسوحة (Scanned)
 */
export async function triagePdf(filePath: string): Promise<{ isScanned: boolean, textLength: number, numPages: number, rawText: string }> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfjs = await getPdfJs();
    
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(dataBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    let rawText = '';
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
        rawText += pageText + '\n';
      } catch (pageErr) {
        console.warn(`Failed to extract text from page ${i}:`, pageErr);
      }
    }
    
    // Clean up memory
    await pdfDocument.destroy();
    
    const textLength = rawText.length;
    const avgCharsPerPage = textLength / (numPages || 1);
    const isScanned = avgCharsPerPage < 50;
    
    return {
      isScanned,
      textLength,
      numPages,
      rawText
    };
  } catch (error) {
    console.warn('pdfjs-dist failed to parse or load PDF, falling back to Gemini AI OCR route:', error);
    return {
      isScanned: true,
      textLength: 0,
      numPages: 1,
      rawText: ''
    };
  }
}

/**
 * المرحلة 2: المعالجة والـ OCR (للملفات الممسوحة ضوئياً)
 * الهدف: بما أن الملف Scanned، نستخدم أحدث ميزة من Google وهي File API 
 * التي تدعم رفع ملف الـ PDF مباشرة ويقوم Gemini 1.5 Flash بعمل OCR عالي الدقة (يدعم العربية والإنجليزية).
 */
export async function processScannedPdfWithGemini(filePath: string, mimeType: string = 'application/pdf'): Promise<string> {
  try {
    console.log(`جارِ تحويل الملف ${filePath} وقراءته لعمل OCR...`);
    const dataBuffer = fs.readFileSync(filePath);
    const base64Data = dataBuffer.toString('base64');
    
    const ai = getGemini();
    
    // استخدام نموذج gemini-2.5-flash السريع جداً والرخيص لاستخراج النص بدقة (OCR)
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        { text: "أنت خبير OCR دقيق جداً. استخرج جميع النصوص من هذا الملف بدقة متناهية كما هي، سواء كانت باللغة العربية أو الإنجليزية. لا تضف أي تعليقات، ولا تقم بتلخيص أي شيء. فقط النص الأصلي." }
      ]
    });

    return result.text || '';
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
    
    if (triageInfo.isScanned || /[\u0600-\u06FF]/.test(triageInfo.rawText)) {
        // 2. إذا كان صورياً، أو يحتوي على نص عربي، نرسله لمسار الـ OCR باستخدام Gemini 1.5 Flash
        // ملاحظة: مسار الـ OCR يعالج مشكلة ظهور النص العربي من اليسار لليمين بشكل ممتاز.
        console.log('توجيه الملف إلى مسار الـ Vision و الـ OCR (بسبب كونه صورياً أو يحتوي على نص عربي)...');
        finalText = await processScannedPdfWithGemini(filePath);
    } else {
        // إذا كان نصياً (وغير عربي)، نستفيد من النص الذي تم استخراجه بالفعل لتوفير التكلفة والوقت
        console.log('توجيه الملف إلى مسار النصوص السريع...');
        finalText = triageInfo.rawText;
    }
    
    console.log('--- تمت عملية الاستخراج بنجاح ---');
    return finalText;
}

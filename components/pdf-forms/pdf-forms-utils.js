import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export function hexToRgbPdfLib(hex) {
  if (!hex) return undefined;
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

// --- الدالة 1: معالجة النص العربي ---
export function reverseArabicText(text) {
  if (!text) return '';
  const arabicRegex = /[\u0600-\u06FF]/;
  if (!arabicRegex.test(text)) return text;
  
  return text
    .split('\n')
    .map(line =>
      line
        .split(' ')
        .reverse()
        .join(' ')
    )
    .join('\n');
}

// --- الدالة 2: إنشاء PDF تفاعلي من الصفر ---
export async function generateInteractivePDF(formConfig) {
  const { fields, pageSize = [595, 842], formName } = formConfig;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit.default || fontkit);

  let arabicFont;
  try {
    const fontUrl = '/fonts/Cairo.ttf';
    const fontBytes = await fetch(fontUrl).then(r => {
      if (!r.ok) throw new Error('Font fetch failed');
      return r.arrayBuffer();
    });
    arabicFont = await pdfDoc.embedFont(fontBytes);
  } catch (fontErr) {
    console.warn("Falling back to standard font - Arabic might not render correctly", fontErr);
    arabicFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const page = pdfDoc.addPage(pageSize);
  const form = pdfDoc.getForm();

  for (const field of fields) {
    const { type, x, y, width, height, label, name, options, required } = field;
    const pdfY = pageSize[1] - y - height;

    if (label) {
      const reversedLabel = reverseArabicText(label);
      page.drawText(reversedLabel, {
        x: x,
        y: pdfY + height + 4,
        size: field.fontSize || 12,
        font: arabicFont,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    switch (type) {
      case 'text':
      case 'textarea':
      case 'date':
      case 'email':
      case 'phone':
      case 'number': {
        const textField = form.createTextField(name || `field_${Date.now()}`);
        textField.setText('');
        if (field.multiline) textField.enableMultiline();
        if (required) textField.enableRequired();
        textField.addToPage(page, {
          x, y: pdfY, width, height,
          textColor: hexToRgbPdfLib(field.textColor) || rgb(0, 0, 0),
          backgroundColor: hexToRgbPdfLib(field.backgroundColor) || rgb(0.97, 0.97, 1),
          borderColor: rgb(0.6, 0.6, 0.8),
          borderWidth: 1,
          font: arabicFont,
        });
        break;
      }

      case 'checkbox': {
        const checkbox = form.createCheckBox(name || `cb_${Date.now()}`);
        if (required) checkbox.enableRequired();
        checkbox.addToPage(page, {
          x, y: pdfY, width: height, height,
          backgroundColor: hexToRgbPdfLib(field.backgroundColor) || rgb(1, 1, 1),
          borderColor: hexToRgbPdfLib(field.textColor) || rgb(0.3, 0.3, 0.8),
          borderWidth: 1.5,
          textColor: hexToRgbPdfLib(field.textColor) || rgb(0, 0, 0),
        });
        break;
      }

      case 'radio': {
        const radioGroup = form.createRadioGroup(name || `rg_${Date.now()}`);
        const optionWidth = width / (options?.length || 1);
        (options || []).forEach((opt, i) => {
          radioGroup.addOptionToPage(opt.value || opt, page, {
            x: x + i * optionWidth,
            y: pdfY,
            width: height,
            height,
            backgroundColor: hexToRgbPdfLib(field.backgroundColor),
            borderColor: hexToRgbPdfLib(field.textColor),
            textColor: hexToRgbPdfLib(field.textColor),
          });
        });
        if (required) radioGroup.enableRequired();
        break;
      }

      case 'dropdown': {
        const dropdown = form.createDropdown(name || `dd_${Date.now()}`);
        const optionValues = (options || []).map(o =>
          typeof o === 'string' ? o : o.value
        );
        dropdown.addOptions(optionValues);
        if (required) dropdown.enableRequired();
        dropdown.addToPage(page, {
          x, y: pdfY, width, height,
          textColor: hexToRgbPdfLib(field.textColor) || rgb(0, 0, 0),
          backgroundColor: hexToRgbPdfLib(field.backgroundColor) || rgb(0.97, 0.97, 1),
          borderColor: rgb(0.6, 0.6, 0.8),
          borderWidth: 1,
          font: arabicFont,
        });
        break;
      }

      case 'signature': {
        const sigField = form.createTextField(name || `sig_${Date.now()}`);
        sigField.addToPage(page, {
          x, y: pdfY, width, height,
          backgroundColor: hexToRgbPdfLib(field.backgroundColor) || rgb(0.98, 0.98, 0.98),
          borderColor: rgb(0.2, 0.2, 0.2),
          borderWidth: 0,
        });
        page.drawLine({
          start: { x, y: pdfY },
          end: { x: x + width, y: pdfY },
          thickness: 1,
          color: hexToRgbPdfLib(field.textColor) || rgb(0.2, 0.2, 0.2),
        });
        break;
      }
    }
  }

  pdfDoc.setTitle(formName || 'نموذج تفاعلي');
  pdfDoc.setLanguage('ar');
  pdfDoc.setCreator('PDF Forms Builder');

  try {
    const form = pdfDoc.getForm();
    form.updateFieldAppearances(arabicFont);
  } catch (e) {}

  const pdfBytes = await pdfDoc.save({ updateFieldAppearances: false });
  return pdfBytes;
}

// --- الدالة 3: تعبئة PDF موجود بحقول جديدة ---
export async function fillExistingPDF(pdfFile, fields, formData) {
  const existingPdfBytes = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit.default || fontkit);

  let arabicFont;
  try {
    const fontUrl = '/fonts/Cairo.ttf';
    const fontBytes = await fetch(fontUrl).then(r => {
      if (!r.ok) throw new Error('Font fetch failed');
      return r.arrayBuffer();
    });
    arabicFont = await pdfDoc.embedFont(fontBytes);
  } catch (fontErr) {
    console.warn("Falling back to standard font - Arabic might not render correctly", fontErr);
    arabicFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { height: pageHeight } = firstPage.getSize();

  try {
    const form = pdfDoc.getForm();
    const existingFields = form.getFields();
    existingFields.forEach(field => {
      const fieldName = field.getName();
      if (formData[fieldName] !== undefined) {
        if (field.constructor.name === 'PDFTextField') {
          try {
            field.setText(reverseArabicText(String(formData[fieldName])));
            field.updateAppearances({ font: arabicFont });
          } catch(err) {
            console.warn("Could not set text/appearance for existing field", err);
          }
        } else if (field.constructor.name === 'PDFCheckBox') {
          formData[fieldName] ? field.check() : field.uncheck();
        } else if (field.constructor.name === 'PDFDropdown') {
          try { field.select(formData[fieldName]); } catch(e){}
        }
      }
    });
    try {
      form.updateFieldAppearances(arabicFont);
    } catch(err) {
      console.warn("Form field appearance update failed", err);
    }
  } catch (e) {
    // No existing AcroForm
  }

  for (const field of fields) {
    const pdfY = pageHeight - field.y - field.height;

    if ((field.type === 'text' || field.type === 'textarea' || field.type === 'date') && formData[field.name]) {
      const text = reverseArabicText(String(formData[field.name]));
      const textColorMap = hexToRgbPdfLib(field.textColor);
      firstPage.drawText(text, {
        x: field.x,
        y: pdfY + (field.height / 2) - 6,
        size: field.fontSize || 12,
        font: arabicFont,
        color: textColorMap || rgb(0, 0, 0.1),
      });
    }
    // Handle other types as needed
  }

  const pdfBytes = await pdfDoc.save({ updateFieldAppearances: false });
  return pdfBytes;
}

// --- الدالة 4: تحميل الـ PDF ---
export function downloadPDF(pdfBytes, filename = 'نموذج.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- الدالة 5: تحويل fields لـ formConfig ---
export function buildFormConfig(canvasFields, formName) {
  return {
    formName,
    pageSize: [794, 1123],
    fields: canvasFields.map(f => ({
      type: f.type,
      name: f.name || `${f.type}_${f.id}`,
      label: f.label,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      fontSize: f.fontSize || 12,
      required: f.required || false,
      options: f.options || [],
      multiline: f.type === 'textarea' || f.multiline || false,
      placeholder: f.placeholder || '',
      textColor: f.textColor,
      backgroundColor: f.backgroundColor,
    })),
  };
}

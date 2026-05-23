const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function test() {
  const pdfDoc = await PDFDocument.create();
  const fontUrl = 'https://raw.githubusercontent.com/googlefonts/cairo/main/fonts/ttf/Cairo-Regular.ttf';
  const fontBytes = await fetch(fontUrl).then(r => r.arrayBuffer());
  const customFont = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.addPage();
  const form = pdfDoc.getForm();
  const textField = form.createTextField('test');
  textField.addToPage(page, { x: 50, y: 50, width: 200, height: 50 });

  // Test set text
  try {
    textField.defaultUpdateAppearances(customFont);
    textField.setText('ح');
    console.log("Success with defaultUpdateAppearances");
  } catch (e) {
    console.log("Failed with defaultUpdateAppearances:", e.message);
  }

  // Workaround test
  try {
    textField.setText('ح'); // this will probably fail if defaultUpdateAppearances is not a thing or didn't work
    console.log("Success setText");
  } catch(e) {
    console.log("Failed setText:", e.message);
  }

}
test();

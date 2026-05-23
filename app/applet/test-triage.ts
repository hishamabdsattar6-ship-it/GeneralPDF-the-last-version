import { triagePdf } from '../../src/lib/pdfPipeline.ts';
import fs from 'fs';

async function main() {
  fs.writeFileSync('test.pdf', '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 0\n/Kids []\n>>\nendobj\nxref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000057 00000 n\ntrailer\n<<\n/Size 3\n/Root 1 0 R\n>>\nstartxref\n111\n%%EOF');
  const res = await triagePdf('test.pdf');
  console.log('Result:', res);
}
main().catch(console.error);

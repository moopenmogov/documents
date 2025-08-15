const fs = require('fs');
const { PDFDocument, StandardFonts } = require('pdf-lib');

(async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('Test Primary', { x: 50, y: 750, size: 18, font });
  fs.writeFileSync('primary.pdf', await doc.save());
})();




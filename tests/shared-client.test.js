process.env.DOCX_PDF_STUB = '1';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { describe, it, before } = require('node:test');

// Polyfill btoa and FileReader for Node environment
before(() => {
  if (typeof global.btoa === 'undefined') {
    global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
  }
  if (typeof global.FileReader === 'undefined') {
    global.FileReader = class FileReaderPolyfill {
      constructor() { this.result = null; this.onload = null; this.onerror = null; }
      async readAsArrayBuffer(obj) {
        try {
          let ab;
          if (obj && typeof obj.arrayBuffer === 'function') {
            const arrBuf = await obj.arrayBuffer();
            if (arrBuf instanceof ArrayBuffer) ab = arrBuf; else ab = arrBuf.buffer;
          } else if (Buffer.isBuffer(obj)) {
            ab = obj.buffer.slice(obj.byteOffset, obj.byteOffset + obj.byteLength);
          } else {
            ab = new ArrayBuffer(0);
          }
          this.result = ab;
          if (typeof this.onload === 'function') this.onload();
        } catch (e) {
          this.onerror && this.onerror(e);
        }
      }
    };
  }
});

const client = require('../shared/compile-client');

function makeBlobLikeFromBuffer(buffer, name, mime) {
  return {
    name: name || 'file.bin',
    type: mime || 'application/octet-stream',
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
  };
}

describe('Shared client helper (Node polyfilled)', () => {
  const baseUrl = 'http://localhost:3001';

  it('getLimits returns configured limits', async () => {
    const limits = await client.getLimits({ baseUrl });
    assert.ok(limits);
    assert.equal(typeof limits.maxFiles, 'number');
    assert.equal(typeof limits.perFileMax, 'number');
  });

  it('listExhibits returns arrays', async () => {
    const { defaults, uploads } = await client.listExhibits({ baseUrl });
    assert.ok(Array.isArray(defaults));
    assert.ok(Array.isArray(uploads));
  });

  it('uploadExhibit + compilePdf with exhibitsById + deleteExhibit', async () => {
    const pdfPath = path.join(__dirname, 'fixtures', 'primary.pdf');
    const buf = fs.readFileSync(pdfPath);
    const blobLike = makeBlobLikeFromBuffer(buf, 'Upload.pdf', 'application/pdf');

    const userId = `test-${Date.now()}`;
    const uploaded = await client.uploadExhibit(blobLike, userId, { baseUrl });
    assert.ok(uploaded && uploaded.id);

    const { uploads } = await client.listExhibits({ baseUrl });
    const mine = uploads.filter(x => x.userId === userId);
    const ids = mine.slice(0, 1).map(x => x.id);

    const base64Primary = Buffer.from(buf).toString('base64');
    const pdfBlob = await client.compilePdf({ base64Pdf: base64Primary, exhibitsById: ids }, { baseUrl });
    assert.ok(pdfBlob);
    if (typeof pdfBlob.size === 'number') {
      assert.ok(pdfBlob.size > 0);
    }

    await client.deleteExhibit(ids[0], { baseUrl });
    const post = await client.listExhibits({ baseUrl });
    assert.ok(!post.uploads.find(x => x.id === ids[0]));
  });

  it('replaceDefault accepts a DOCX-like upload', async () => {
    const stub = Buffer.from('stub-docx-content');
    const docxLike = makeBlobLikeFromBuffer(stub, 'Test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    const cur = await client.replaceDefault(docxLike, { baseUrl });
    assert.ok(cur && cur.filename);
  });
});



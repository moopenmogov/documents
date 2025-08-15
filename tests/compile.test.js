const assert = require('assert');
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { describe, it, before } = require('node:test');
const app = require('../api-server');

// Minimal 1-page PDF (created via pdf-lib in prior steps). To avoid deps here, read a fixture if present.
function readFixturePdf() {
  const p1 = path.join(__dirname, 'fixtures', 'primary.pdf');
  if (!fs.existsSync(p1)) {
    throw new Error('Missing test fixture: tests/fixtures/primary.pdf');
  }
  return fs.readFileSync(p1);
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

describe('Compile API', () => {
  const exhibitsDir = path.join(process.cwd(), 'exhibits');

  before(() => {
    process.env.DOCX_PDF_STUB = '1';
    ensureDir(exhibitsDir);
    // Ensure at least one exhibit file exists by copying primary to exhibits
    const primaryBytes = readFixturePdf();
    fs.writeFileSync(path.join(exhibitsDir, 'exhibit-a.pdf'), primaryBytes);
    // Create a stub current.docx so server-side conversion path is testable
    const defaultDir = path.join(process.cwd(), 'default-document');
    ensureDir(defaultDir);
    fs.writeFileSync(path.join(defaultDir, 'current.docx'), Buffer.from('stub-docx','utf8'));
  });

  it('compiles without exhibits', async () => {
    const primaryB64 = readFixturePdf().toString('base64');
    const res = await request(app)
      .post('/api/compile')
      .send({ base64Pdf: primaryB64 })
      .set('Content-Type', 'application/json');
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'] || '', /application\/pdf/);
    assert.ok(res.body instanceof Buffer || res.body);
  });

  it('compiles with single exhibitPath', async () => {
    const primaryB64 = readFixturePdf().toString('base64');
    const exhibitPath = path.join(exhibitsDir, 'exhibit-a.pdf');
    const res = await request(app)
      .post('/api/compile')
      .send({ base64Pdf: primaryB64, exhibitPath })
      .set('Content-Type', 'application/json');
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'] || '', /application\/pdf/);
  });

  it('compiles with two exhibits (ordered)', async () => {
    const primaryB64 = readFixturePdf().toString('base64');
    const p = path.join(exhibitsDir, 'exhibit-a.pdf');
    const res = await request(app)
      .post('/api/compile')
      .send({ base64Pdf: primaryB64, exhibits: [
        { path: p, include: true, order: 2 },
        { path: p, include: true, order: 1 }
      ]})
      .set('Content-Type', 'application/json');
    assert.equal(res.statusCode, 200);
  });

  it('compiles using server-side primary (current DOCX)', async () => {
    const res = await request(app)
      .post('/api/compile')
      .send({ primary: { type: 'current', include: true } })
      .set('Content-Type', 'application/json');
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'] || '', /application\/pdf/);
  });

  it('errors when default document missing for server-side primary', async () => {
    // Temporarily move current.docx away
    const defaultDir = path.join(process.cwd(), 'default-document');
    const cur = path.join(defaultDir, 'current.docx');
    const bak = path.join(defaultDir, 'current.bak');
    if (fs.existsSync(bak)) fs.unlinkSync(bak);
    fs.renameSync(cur, bak);
    const res = await request(app)
      .post('/api/compile')
      .send({ primary: { type: 'current', include: true } })
      .set('Content-Type', 'application/json');
    assert.equal(res.statusCode, 400);
    assert.equal(res.body?.error, 'default_document_missing');
    // restore
    fs.renameSync(bak, cur);
  });

  it('returns exhibits_missing when a path is missing', async () => {
    const primaryB64 = readFixturePdf().toString('base64');
    const res = await request(app)
      .post('/api/compile')
      .send({ base64Pdf: primaryB64, exhibits: [
        { path: path.join(exhibitsDir, 'no-such.pdf'), include: true, order: 1 }
      ]})
      .set('Content-Type', 'application/json');
    assert.equal(res.statusCode, 400);
    assert.equal(res.body?.error, 'exhibits_missing');
  });

  it('enforces max 2 exhibits', async () => {
    const primaryB64 = readFixturePdf().toString('base64');
    const p = path.join(exhibitsDir, 'exhibit-a.pdf');
    const res = await request(app)
      .post('/api/compile')
      .send({ base64Pdf: primaryB64, exhibits: [
        { path: p, include: true, order: 1 },
        { path: p, include: true, order: 2 },
        { path: p, include: true, order: 3 }
      ]})
      .set('Content-Type', 'application/json');
    assert.equal(res.statusCode, 400);
    assert.equal(res.body?.error, 'too_many_exhibits');
  });
});



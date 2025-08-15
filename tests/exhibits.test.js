const assert = require('assert');
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { describe, it, before } = require('node:test');
const app = require('../api-server');

function readFixturePdf() {
  const p1 = path.join(__dirname, 'fixtures', 'primary.pdf');
  if (!fs.existsSync(p1)) throw new Error('Missing tests/fixtures/primary.pdf');
  return fs.readFileSync(p1);
}

describe('Exhibits API', () => {
  before(() => {
    // Ensure directories
    const exhibitsDir = path.join(process.cwd(), 'exhibits');
    if (!fs.existsSync(exhibitsDir)) fs.mkdirSync(exhibitsDir, { recursive: true });
  });

  it('uploads a PDF exhibit and lists it', async () => {
    const b64 = readFixturePdf().toString('base64');
    const upload = await request(app)
      .post('/api/upload-exhibit')
      .send({ base64Pdf: b64, originalFilename: 'Test Exhibit.pdf', userId: 'user1' })
      .set('Content-Type', 'application/json');
    assert.equal(upload.statusCode, 200);
    assert.equal(upload.body?.success, true);
    const id = upload.body?.exhibit?.id;
    assert.ok(id);

    const list = await request(app).get('/api/exhibits/list');
    assert.equal(list.statusCode, 200);
    assert.equal(list.body?.success, true);
    assert.ok(Array.isArray(list.body?.uploads));
    assert.ok(list.body.uploads.find(x => x.id === id));
  });

  it('rejects non-PDF upload by filename', async () => {
    const b64 = Buffer.from('x').toString('base64');
    const r = await request(app)
      .post('/api/upload-exhibit')
      .send({ base64Pdf: b64, originalFilename: 'not.pdf.txt' })
      .set('Content-Type', 'application/json');
    assert.equal(r.statusCode, 400);
    assert.equal(r.body?.error, 'unsupported_media_type');
  });

  it('deletes an uploaded exhibit by id', async () => {
    const b64 = readFixturePdf().toString('base64');
    const upload = await request(app)
      .post('/api/upload-exhibit')
      .send({ base64Pdf: b64, originalFilename: 'Delete Me.pdf', userId: 'user1' })
      .set('Content-Type', 'application/json');
    const id = upload.body?.exhibit?.id;
    const del = await request(app)
      .post('/api/exhibits/delete')
      .send({ id })
      .set('Content-Type', 'application/json');
    assert.equal(del.statusCode, 200);
    const list = await request(app).get('/api/exhibits/list');
    assert.ok(!list.body.uploads.find(x => x.id === id));
  });

  it('compiles using exhibit IDs resolved server-side', async () => {
    const b64 = readFixturePdf().toString('base64');
    const u1 = await request(app).post('/api/upload-exhibit').send({ base64Pdf: b64, originalFilename: 'A.pdf' }).set('Content-Type','application/json');
    const u2 = await request(app).post('/api/upload-exhibit').send({ base64Pdf: b64, originalFilename: 'B.pdf' }).set('Content-Type','application/json');
    const list = await request(app).get('/api/exhibits/list');
    const ids = list.body.uploads.slice(0,2).map(x => x.id);
    const r = await request(app)
      .post('/api/compile')
      .send({ base64Pdf: b64, exhibitsById: ids.map((id, i) => ({ id, include: true, order: i+1 })) })
      .set('Content-Type','application/json');
    assert.equal(r.statusCode, 200);
    assert.match(r.headers['content-type'] || '', /application\/pdf/);
  });
});



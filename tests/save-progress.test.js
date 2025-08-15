const assert = require('assert');
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { describe, it, before } = require('node:test');
const app = require('../api-server');

function makeDocxLikeBase64() {
  // Minimal PK header + padding to satisfy isLikelyValidDocx
  // Include strings that mimic required entries to satisfy isWellFormedDocx heuristic
  const marker = Buffer.from('[Content_Types].xml word/document.xml');
  return Buffer.concat([Buffer.from('PK'), Buffer.alloc(4096), marker]).toString('base64');
}

describe('Save/Checkin DOCX guards', () => {
  const defaultDir = path.join(process.cwd(), 'default-document');
  before(() => { if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true }); });

  it('rejects invalid base64 on save-progress', async () => {
    // Must checkout first
    await request(app).post('/api/checkout').send({ source: 'word', userId: 'user1' }).set('Content-Type','application/json');
    const res = await request(app)
      .post('/api/save-progress')
      .send({ source: 'word', userId: 'user1', docx: Buffer.from('not-docx').toString('base64'), filename: 'bad.docx' })
      .set('Content-Type','application/json');
    assert.equal(res.statusCode, 400);
    assert.equal(res.body?.error, 'invalid_docx');
  });

  it('accepts valid-looking docx on save-progress', async () => {
    const payload = makeDocxLikeBase64();
    const res = await request(app)
      .post('/api/save-progress')
      .send({ source: 'word', userId: 'user1', docx: payload, filename: 'ok.docx' })
      .set('Content-Type','application/json');
    assert.equal(res.statusCode, 200);
    const saved = fs.readdirSync(defaultDir).find(f => /ok\.docx$/.test(f));
    assert.ok(saved);
  });

  it('rejects invalid base64 on checkin', async () => {
    const res = await request(app)
      .post('/api/checkin')
      .send({ source: 'word', userId: 'user1', docx: Buffer.from('not-docx').toString('base64'), filename: 'bad2.docx' })
      .set('Content-Type','application/json');
    assert.equal(res.statusCode, 400);
    assert.equal(res.body?.error, 'invalid_docx');
  });

  it('accepts valid-looking docx on checkin', async () => {
    const payload = makeDocxLikeBase64();
    const res = await request(app)
      .post('/api/checkin')
      .send({ source: 'word', userId: 'user1', docx: payload, filename: 'good.docx' })
      .set('Content-Type','application/json');
    assert.equal(res.statusCode, 200);
  });
});



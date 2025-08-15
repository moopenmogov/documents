const assert = require('assert');
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { describe, it, before } = require('node:test');
const app = require('../api-server');

describe('Replace default', () => {
  const defaultDir = path.join(process.cwd(), 'default-document');

  before(() => {
    if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true });
  });

  it('rejects non-docx by filename', async () => {
    const res = await request(app)
      .post('/api/replace-default')
      .send({ base64Docx: Buffer.from('x').toString('base64'), originalFilename: 'foo.txt' })
      .set('Content-Type', 'application/json');
    assert.equal(res.statusCode, 400);
    assert.equal(res.body?.error, 'unsupported_media_type');
  });

  it('accepts and atomically writes current.docx', async () => {
    const beforeStat = fs.existsSync(path.join(defaultDir, 'current.docx')) ? fs.statSync(path.join(defaultDir, 'current.docx')).mtimeMs : 0;
    // minimally valid-looking zip header for docx
    const payload = Buffer.concat([Buffer.from('PK'), Buffer.alloc(2048)]).toString('base64');
    const res = await request(app)
      .post('/api/replace-default')
      .send({ base64Docx: payload, originalFilename: 'My Contract.docx' })
      .set('Content-Type', 'application/json');
    assert.equal(res.statusCode, 200);
    const afterStat = fs.statSync(path.join(defaultDir, 'current.docx')).mtimeMs;
    assert.ok(afterStat >= beforeStat);
    assert.equal(res.body?.success, true);
    assert.equal(res.body?.currentDocument?.filename, 'My Contract.docx');
  });
});




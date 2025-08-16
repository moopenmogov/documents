const assert = require('assert');
const request = require('supertest');
const { describe, it, before } = require('node:test');
const fs = require('fs');
const path = require('path');
const app = require('../api-server');

describe('Approvals API', () => {
  let docId = 'default-doc';
  const editor = 'user1'; // Warren Peace (editor)
  const nonEditor = 'user2'; // Gettysburger (viewer)

  before(() => {
    // Ensure clean state files exist
    try {
      const p = path.join(process.cwd(), 'approvals-state.json');
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  });

  it('returns initial snapshot with seeded approvers', async () => {
    const res = await request(app).get('/api/approvals/state');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.approvers));
    assert.ok(res.body.approvers.length > 0);
    docId = res.body.documentId;
  });

  it('allows editor to approve another user', async () => {
    const state = await request(app).get('/api/approvals/state');
    const target = state.body.approvers.find(a => a.userId !== editor) || state.body.approvers[0];
    const res = await request(app).post('/api/approvals/approve').send({ documentId: docId, targetUserId: target.userId, actorId: editor, comment: 'LGTM' }).set('Content-Type','application/json');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.approver.status, 'approved');
  });

  it('prevents non-editor from approving others', async () => {
    const state = await request(app).get('/api/approvals/state');
    const other = state.body.approvers.find(a => a.userId !== nonEditor) || state.body.approvers[0];
    const res = await request(app).post('/api/approvals/approve').send({ documentId: docId, targetUserId: other.userId, actorId: nonEditor }).set('Content-Type','application/json');
    assert.equal(res.statusCode, 403);
  });

  it('allows non-editor to approve self', async () => {
    const res = await request(app).post('/api/approvals/approve').send({ documentId: docId, targetUserId: nonEditor, actorId: nonEditor }).set('Content-Type','application/json');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.approver.userId, nonEditor);
  });

  it('supports reject with comment', async () => {
    const res = await request(app).post('/api/approvals/reject').send({ documentId: docId, targetUserId: nonEditor, actorId: editor, comment: 'Needs changes' }).set('Content-Type','application/json');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.approver.status, 'rejected');
  });

  it('supports notes update (self only)', async () => {
    const res = await request(app).post('/api/approvals/update-notes').send({ documentId: docId, targetUserId: nonEditor, actorId: nonEditor, notes: 'My note' }).set('Content-Type','application/json');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.approver.notes, 'My note');
  });

  it('prevents long notes', async () => {
    const long = 'x'.repeat(201);
    const res = await request(app).post('/api/approvals/update-notes').send({ documentId: docId, targetUserId: nonEditor, actorId: nonEditor, notes: long }).set('Content-Type','application/json');
    assert.equal(res.statusCode, 400);
  });

  it('allows editor to add and delete users', async () => {
    const add = await request(app).post('/api/approvals/add-user').send({ documentId: docId, name: 'New Person', email: 'new@ex.com', actorId: editor }).set('Content-Type','application/json');
    assert.equal(add.statusCode, 200);
    const id = add.body.approver.userId;
    assert.ok(id);
    const del = await request(app).post('/api/approvals/delete-user').send({ documentId: docId, targetUserId: id, actorId: editor }).set('Content-Type','application/json');
    assert.equal(del.statusCode, 200);
    assert.equal(del.body.removed, 1);
  });

  it('rejects invalid email on add-user', async () => {
    const add = await request(app).post('/api/approvals/add-user').send({ documentId: docId, name: 'X', email: 'nope', actorId: editor }).set('Content-Type','application/json');
    assert.equal(add.statusCode, 400);
    assert.equal(add.body.error, 'invalid_email');
  });

  it('allows editor to reorder', async () => {
    const state = await request(app).get('/api/approvals/state');
    const list = state.body.approvers;
    const inverted = list.map((a, idx) => ({ userId: a.userId, order: list.length - idx }));
    const res = await request(app).post('/api/approvals/reorder').send({ documentId: docId, order: inverted, actorId: editor }).set('Content-Type','application/json');
    assert.equal(res.statusCode, 200);
    // Ensure returned list is normalized ascending 1..n
    const orders = res.body.approvers.map(a => a.order);
    assert.deepEqual(orders, orders.slice().sort((a,b)=>a-b));
  });

  it('serves approvals/state against currentDocument.id after a user switch', async () => {
    // Simulate Word user switch and ensure approvals/state responds using current doc id
    const sw = await request(app).post('/api/user/word/switch').send({ userId: 'user2' }).set('Content-Type','application/json');
    assert.equal(sw.statusCode, 200);
    // Ensure current document id is available
    const cur = await request(app).get('/api/current-document');
    assert.equal(cur.statusCode, 200);
    const docId = cur.body && (cur.body.id || cur.body.documentId) || 'default-doc';
    const state = await request(app).get(`/api/approvals/state?documentId=${encodeURIComponent(docId)}`);
    assert.equal(state.statusCode, 200);
    assert.equal(state.body.success, true);
    assert.ok(Array.isArray(state.body.approvers));
    assert.ok(state.body.approvers.length > 0);
  });

  it('rejects reorder by non-editor', async () => {
    const state = await request(app).get('/api/approvals/state');
    const list = state.body.approvers;
    const same = list.map(a => ({ userId: a.userId, order: a.order }));
    const res = await request(app).post('/api/approvals/reorder').send({ documentId: docId, order: same, actorId: nonEditor }).set('Content-Type','application/json');
    assert.equal(res.statusCode, 403);
  });

  it('rejects delete-user by non-editor', async () => {
    const add = await request(app).post('/api/approvals/add-user').send({ documentId: docId, name: 'Temp', email: 'temp@ex.com', actorId: editor }).set('Content-Type','application/json');
    const id = add.body.approver.userId;
    const del = await request(app).post('/api/approvals/delete-user').send({ documentId: docId, targetUserId: id, actorId: nonEditor }).set('Content-Type','application/json');
    assert.equal(del.statusCode, 403);
  });

  it('remind returns success message', async () => {
    const state = await request(app).get('/api/approvals/state');
    const target = state.body.approvers[0];
    const res = await request(app).post('/api/approvals/remind').send({ documentId: docId, targetUserId: target.userId, actorId: editor }).set('Content-Type','application/json');
    assert.equal(res.statusCode, 200);
    assert.match(res.body.message || '', /emailed a reminder/i);
  });
});



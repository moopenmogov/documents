/* Shared client helper for approvals APIs */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ApprovalsClient = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const DEFAULT_BASE_URL = 'http://localhost:3001';
  function joinUrl(base, path) { return (base || DEFAULT_BASE_URL).replace(/\/$/, '') + path; }
  function normalizeError(errorBody) {
    const err = errorBody || {}; const code = err.error || 'unknown_error'; let message = err.message || '';
    if (!message) {
      if (code === 'forbidden') message = 'You do not have permission to perform this action.';
      if (code === 'actor_not_found') message = 'Actor not found.';
      if (code === 'target_not_found') message = 'Target user not found.';
      if (code === 'invalid_notes') message = 'Notes must be 200 characters or fewer.';
      if (code === 'invalid_email') message = 'Enter a valid email address.';
    }
    return { code, message, details: err };
  }
  async function handleJsonResponse(resp) {
    const ct = resp.headers.get('content-type') || ''; const isJson = ct.includes('application/json');
    if (!resp.ok) { const body = isJson ? await resp.json().catch(() => ({})) : {}; throw normalizeError(body); }
    return isJson ? resp.json() : resp;
  }
  async function getState(params = {}, opts = {}) {
    const qs = new URLSearchParams();
    if (params.documentId) qs.set('documentId', params.documentId);
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/approvals/state' + (qs.toString() ? ('?' + qs.toString()) : '')), { cache: 'no-store' });
    return handleJsonResponse(resp);
  }
  async function approve({ documentId, targetUserId, actorId, comment }, opts = {}) {
    const body = { documentId, targetUserId, actorId, comment };
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/approvals/approve'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return handleJsonResponse(resp);
  }
  async function reject({ documentId, targetUserId, actorId, comment }, opts = {}) {
    const body = { documentId, targetUserId, actorId, comment };
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/approvals/reject'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return handleJsonResponse(resp);
  }
  async function remind({ documentId, targetUserId, actorId }, opts = {}) {
    const body = { documentId, targetUserId, actorId };
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/approvals/remind'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return handleJsonResponse(resp);
  }
  async function addUser({ documentId, name, email, actorId }, opts = {}) {
    const body = { documentId, name, actorId };
    if (email && String(email).trim()) body.email = String(email).trim();
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/approvals/add-user'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return handleJsonResponse(resp);
  }
  async function deleteUser({ documentId, targetUserId, actorId }, opts = {}) {
    const body = { documentId, targetUserId, actorId };
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/approvals/delete-user'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return handleJsonResponse(resp);
  }
  async function reorder({ documentId, order, actorId }, opts = {}) {
    const body = { documentId, order, actorId };
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/approvals/reorder'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return handleJsonResponse(resp);
  }
  async function updateNotes({ documentId, targetUserId, notes, actorId }, opts = {}) {
    const body = { documentId, targetUserId, notes, actorId };
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/approvals/update-notes'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return handleJsonResponse(resp);
  }
  return { getState, approve, reject, remind, addUser, deleteUser, reorder, updateNotes, normalizeError };
});



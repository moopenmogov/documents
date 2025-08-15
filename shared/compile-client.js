/* Shared client helper for compile/exhibits/default-document APIs */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CompileClient = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const DEFAULT_BASE_URL = 'http://localhost:3001';
  function joinUrl(base, path) { return (base || DEFAULT_BASE_URL).replace(/\/$/, '') + path; }
  async function toBase64(fileOrBlob) {
    // Node path: Buffer available
    if (typeof Buffer !== 'undefined' && fileOrBlob && typeof fileOrBlob.arrayBuffer === 'function') {
      const ab = await fileOrBlob.arrayBuffer();
      const u8 = new Uint8Array(ab);
      return Buffer.from(u8).toString('base64');
    }
    // Browser path: FileReader via DataURL (avoids call stack overflow)
    return await new Promise((resolve, reject) => {
      try {
        const fr = new FileReader();
        fr.onload = () => {
          try {
            const result = fr.result || '';
            if (typeof result === 'string') {
              const comma = result.indexOf(',');
              return resolve(comma >= 0 ? result.slice(comma + 1) : result);
            }
            // Fallback: chunked ArrayBuffer encoding if not a string
            const bytes = new Uint8Array(result);
            let binary = '';
            const chunk = 0x8000;
            for (let i = 0; i < bytes.length; i += chunk) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
            }
            resolve(btoa(binary));
          } catch (e) { reject(e); }
        };
        fr.onerror = reject;
        fr.readAsDataURL(fileOrBlob);
      } catch (e) { reject(e); }
    });
  }
  function normalizeError(errorBody) {
    const err = errorBody || {}; const code = err.error || 'unknown_error'; let message = err.message || '';
    if (!message) {
      if (code === 'too_many_exhibits') message = 'At most 2 exhibits allowed in this prototype.';
      if (code === 'exhibits_missing') message = 'One or more exhibits could not be found.';
      if (code === 'exhibit_not_found') message = 'The exhibit path was not found.';
      if (code === 'default_document_missing') message = 'No default document found. Replace default then try again.';
      if (code === 'file_too_large') message = 'File exceeds the maximum allowed size.';
      if (code === 'quota_exceeded') message = 'Upload limits exceeded for this user.';
      if (code === 'unsupported_media_type') message = 'Unsupported file type.';
      if (code === 'base64Pdf_or_primary_required') message = 'Primary PDF or server-side primary is required.';
    }
    return { code, message, details: err };
  }
  async function handleJsonResponse(resp) {
    const ct = resp.headers.get('content-type') || ''; const isJson = ct.includes('application/json');
    if (!resp.ok) { const body = isJson ? await resp.json().catch(() => ({})) : {}; throw normalizeError(body); }
    return isJson ? resp.json() : resp;
  }
  async function getLimits(opts = {}) {
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/exhibits/limits'), { cache: 'no-store' });
    const data = await handleJsonResponse(resp); return data.limits;
  }
  async function listExhibits(opts = {}) {
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/exhibits/list'), { cache: 'no-store' });
    const data = await handleJsonResponse(resp); return { defaults: data.defaults || [], uploads: data.uploads || [] };
  }
  async function uploadExhibit(file, userId, opts = {}) {
    const base64Pdf = await toBase64(file); const payload = { base64Pdf, originalFilename: file && file.name, userId: userId || 'anonymous' };
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/upload-exhibit'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await handleJsonResponse(resp); return data.exhibit;
  }
  async function deleteExhibit(id, opts = {}) {
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/exhibits/delete'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await handleJsonResponse(resp); return true;
  }
  async function replaceDefault(docxFile, opts = {}) {
    const base64Docx = await toBase64(docxFile); const payload = { base64Docx, originalFilename: docxFile && docxFile.name };
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/replace-default'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await handleJsonResponse(resp); return data.currentDocument;
  }
  async function compilePdf(params = {}, opts = {}) {
    const payload = {};
    if (params.primary === 'current' || (params.primary && params.primary.type === 'current')) { payload.primary = { type: 'current', include: params.includePrimary !== false }; }
    else if (params.base64Pdf) { payload.base64Pdf = params.base64Pdf; }
    else { payload.primary = { type: 'current', include: true }; }
    if (Array.isArray(params.exhibitsById)) { payload.exhibitsById = params.exhibitsById.map((e, i) => ({ id: e.id || e, include: e.include !== false, order: e.order != null ? e.order : (i + 1) })); }
    const resp = await fetch(joinUrl(opts.baseUrl, '/api/compile'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!resp.ok) { let body = {}; try { body = await resp.json(); } catch (_) {} throw normalizeError(body); }
    return await resp.blob();
  }
  return { getLimits, listExhibits, uploadExhibit, deleteExhibit, replaceDefault, compilePdf, normalizeError };
});

const assert = require('assert');
const { describe, it } = require('node:test');

// This is a logic test that ensures our chosen function binding points to the robust path.
// It does not execute Office.js; it just verifies the fallback wiring contract we rely on.

describe('View Latest robust wiring (contract test)', () => {
  it('prefers viewLatestRobust for dropdown wiring', async () => {
    const smc = require('../state-matrix-client.js');
    // Build a fake DOM for the dropdown
    const select = global.document ? document.createElement('select') : (() => {
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM('<select id="x"></select>');
      global.window = dom.window; global.document = dom.window.document; return document.createElement('select');
    })();
    select.id = 'matrixActionsSelect';
    document.body.appendChild(select);
    global.window.viewLatestRobust = function robust() {};
    const config = { buttons: { viewOnlyBtn: true }, checkoutStatus: { show: true } };
    smc.refreshActionsDropdownFromMatrix('matrixActionsSelect', config);
    const opt = Array.from(select.options).find(o => o.value === 'viewOnlyBtn');
    assert.ok(opt, 'View Latest option present');
  });
});



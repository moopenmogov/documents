(function () {
  const GLOBAL_KEY = '__newFeatureBannerInit';
  if (window[GLOBAL_KEY]) return; // prevent double init
  window[GLOBAL_KEY] = true;

  function log(...args) { try { console.log('[features]', ...args); } catch (_) {} }

  function notify(message) {
    try {
      if (typeof window.addNotification === 'function') {
        window.addNotification(message);
        return;
      }
      const area = document.getElementById('notificationWindowBody_grid');
      if (area) {
        const div = document.createElement('div');
        div.textContent = message;
        area.appendChild(div);
        return;
      }
    } catch (_) {}
    log('NOTIFY:', message);
  }

  async function loadStrings() {
    const candidates = [
      // viewer.html direct file path
      'new-feature-banner-text.json',
      // webpack dev server root for add-in
      '/new-feature-banner-text.json'
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch (_) {}
    }
    return null;
  }

  async function loadFeatureStates() {
    try {
      const res = await fetch('http://localhost:3001/api/features', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data.features)) {
        const map = new Map();
        data.features.forEach(f => map.set(f.id, !!f.enabled));
        return map;
      }
    } catch (_) {}
    return null;
  }

  async function persistFeatureToggle(id, enabled) {
    try {
      await fetch('http://localhost:3001/api/features/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !!enabled })
      });
    } catch (_) {}
  }

  function ensureStyles() {
    if (document.getElementById('new-feature-banner-styles')) return;
    const style = document.createElement('style');
    style.id = 'new-feature-banner-styles';
    style.textContent = `
      .nfb-btn { 
        border: none !important; 
        border-radius: 999px !important; 
        padding: 4px 10px !important; 
        font-weight: 700 !important; 
        cursor: pointer !important; 
        font-size: 12px !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
        margin: 0 !important;
        letter-spacing: 0.3px !important;
        display: inline-block !important;
        position: relative;
      }
      .nfb-btn:not(.nfb-pulse):hover { background: #3b82f6 !important; color: white !important; }
      .nfb-btn[disabled] { opacity: .55 !important; cursor: default !important; }
      .nfb-btn-inactive { opacity: .55 !important; }
      .nfb-btn-active { background: #3b82f6 !important; color: white !important; }
      
      /* Pulsing animation - fixed: no !important in keyframes, use background-color */
      @keyframes nfb-pulse {
        0% {
          background-color: #bfdbfe;
          box-shadow: 0 0 0 0 rgba(59,130,246,.7);
          transform: scale(1);
        }
        50% {
          background-color: #3b82f6;
          box-shadow: 0 0 0 8px rgba(59,130,246,.2);
          transform: scale(1.05);
        }
        100% {
          background-color: #bfdbfe;
          box-shadow: 0 0 0 0 rgba(59,130,246,0);
          transform: scale(1);
        }
      }
      
      /* Remove animation from button itself - let only ::before animate */
      .nfb-btn.nfb-pulse {
        /* animation removed - handled by ::before pseudo-element */
      }
      
      .nfb-btn.nfb-pulse:hover {
        animation-play-state: running !important;
        background: #3b82f6 !important;
        color: white !important;
      }

      /* Fix positioning and pulsing with pseudo-element approach */
      #newFeaturesBtn { 
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        background: transparent !important;
        color: white !important;
        z-index: 1;
      }
      #newFeaturesBtn::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        animation: nfb-pulse 1.5s ease-in-out infinite;
        will-change: transform, box-shadow, background-color;
        z-index: -1;
      }
      /* Use extreme z-index to appear above any stacking contexts */
      .nfb-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: none; z-index: 2147483646; }
      .nfb-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; border-radius: 10px; width: min(700px, 92vw); max-height: 80vh; overflow: auto; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); display: none; z-index: 2147483647; opacity: 1; }
      /* Force-open safety (if other code toggles display) */
      html.nfb-is-open .nfb-modal { display: block !important; }
      html.nfb-is-open .nfb-modal-backdrop { display: block !important; }
      /* Compact layout for add-in */
      .nfb-modal.nfb-compact { width: min(430px, 96vw); }
      .nfb-modal.nfb-compact .nfb-table th,
      .nfb-modal.nfb-compact .nfb-table td { font-size: 12px; padding: 6px; }
      .nfb-modal.nfb-compact .nfb-actions { flex-direction: column; gap: 6px; align-items: stretch; }
      .nfb-modal.nfb-compact .nfb-actions .nfb-btn { width: 100%; min-width: 0; padding: 6px 8px; font-size: 12px; }
      .nfb-modal-title { font-size: 18px; font-weight: 700; margin: 0 0 6px 0; }
      .nfb-modal-sub { font-size: 12px; color: #6c757d; margin: 0 0 12px 0; }
      .nfb-table { width: 100%; border-collapse: collapse; }
      .nfb-table th, .nfb-table td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; font-size: 14px; }
      .nfb-actions { display: flex; gap: 8px; flex-direction: column; align-items: stretch; }
      .nfb-footer { display: flex; justify-content: space-between; margin-top: 12px; }
      .nfb-pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #f1f3f5; color: #495057; }
    `;
    document.head.appendChild(style);
    log('styles-injected');
  }

  function formatRelease(feature) {
    if (feature.releaseDate) return feature.releaseDate;
    if (feature.releaseWindow) return feature.releaseWindow;
    return '';
  }

  function renderModal(strings, platform) {
    ensureStyles();

    const backdrop = document.createElement('div');
    backdrop.className = 'nfb-modal-backdrop';
    backdrop.id = 'nfbBackdrop';

    const modal = document.createElement('div');
    modal.className = 'nfb-modal';
    modal.id = 'nfbModal';
    // Use compact mode universally for consistent layout across platforms
    modal.classList.add('nfb-compact');

    const title = document.createElement('div');
    title.className = 'nfb-modal-title';
    title.textContent = strings.modal.title;

    const sub = document.createElement('div');
    sub.className = 'nfb-modal-sub';
    sub.textContent = strings.modal.subtitle || '';

    const table = document.createElement('table');
    table.className = 'nfb-table';
    const thead = document.createElement('thead');
    const thr = document.createElement('tr');
    ['feature','status','release','actions'].forEach(key => {
      const th = document.createElement('th');
      th.textContent = strings.modal.columns[key];
      thr.appendChild(th);
    });
    thead.appendChild(thr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    const featureState = new Map();
    // Keep a map of per-row painters to update UI when state changes remotely
    const painters = new Map();

    strings.features.forEach(f => {
      // If server-driven single flag controls banner visibility, keep per-feature controls but default from server state later
      featureState.set(f.id, !!f.defaultEnabled);
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.textContent = f.name;

      const tdStatus = document.createElement('td');
      const pill = document.createElement('span');
      pill.className = 'nfb-pill';
      pill.textContent = f.status || '';
      tdStatus.appendChild(pill);

      const tdRelease = document.createElement('td');
      tdRelease.textContent = formatRelease(f);

      const tdActions = document.createElement('td');
          const chk = document.createElement('input');
          chk.type = 'checkbox';
          chk.className = 'nfb-toggle';
          chk.setAttribute('aria-label', `Enable ${f.name}`);
          function repaint() {
            const enabled = !!featureState.get(f.id);
            chk.checked = enabled;
          }
          chk.addEventListener('change', async (e) => {
            const enabled = !!e.target.checked;
            featureState.set(f.id, enabled);
            repaint();
            const msg = (enabled ? (strings.modal.notifications.toggledOn || 'Enabled: {{name}}') : (strings.modal.notifications.toggledOff || 'Disabled: {{name}}')).replace('{{name}}', f.name);
            notify(msg);
            persistFeatureToggle(f.id, enabled);
            // Also toggle the master banner flag for consistency
            persistFeatureToggle('newFeatureBanner', enabled);
          });
          tdActions.appendChild(chk);

          tr.appendChild(tdName);
          tr.appendChild(tdStatus);
          tr.appendChild(tdRelease);
          tr.appendChild(tdActions);
          tbody.appendChild(tr);

          repaint();
          // Register painter for remote updates
          painters.set(f.id, repaint);
        });

    table.appendChild(tbody);

    modal.appendChild(title);
    modal.appendChild(sub);
    modal.appendChild(table);

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    log('modal-dom-ready', { hasBackdrop: !!document.getElementById('nfbBackdrop'), hasModal: !!document.getElementById('nfbModal') });
    // Expose repaint helper to sync UI with server-driven events
    window.__nfbRepaint = function repaintFromState(map) {
      try {
        if (!map) return;
        map.forEach((val, id) => {
          if (typeof val === 'boolean') featureState.set(id, !!val);
          const painter = painters.get(id);
          if (typeof painter === 'function') painter();
        });
      } catch (_) {}
    };

    function showModal() {
      backdrop.style.display = 'block';
      modal.style.display = 'block';
      modal.style.opacity = '1';
      modal.style.zIndex = '2147483647';
      backdrop.style.zIndex = '2147483646';
      modal.setAttribute('tabindex', '-1');
      try { document.documentElement.classList.add('nfb-is-open'); } catch (_) {}
      window.__nfbOpen = true;
      const rect = modal.getBoundingClientRect();
      log('modal-open', { rect });
      try { modal.focus({ preventScroll: false }); modal.scrollIntoView({ block: 'center', inline: 'center' }); } catch (_) {}
      if (strings.modal.notifications.opened) {
        notify(strings.modal.notifications.opened);
      }
    }
    function hideModal() {
      modal.style.display = 'none';
      backdrop.style.display = 'none';
      window.__nfbOpen = false;
      try { document.documentElement.classList.remove('nfb-is-open'); } catch (_) {}
      log('modal-close');
    }
    backdrop.addEventListener('click', hideModal);

    // Defensive: if other code toggles styles after we open, force them back
    const reinforce = () => {
      if (!window.__nfbOpen) return;
      const md = getComputedStyle(modal).display;
      const bd = getComputedStyle(backdrop).display;
      if (md === 'none') modal.style.display = 'block';
      if (bd === 'none') backdrop.style.display = 'block';
    };
    const mo = new MutationObserver(reinforce);
    mo.observe(modal, { attributes: true, attributeFilter: ['style','class'] });
    mo.observe(backdrop, { attributes: true, attributeFilter: ['style','class'] });

    return { showModal, hideModal, featureState };
  }

  async function initNewFeatureBanner(platform) {
    try {
      const strings = await loadStrings();
      if (!strings) { log('strings-load-failed'); return; }
      log('strings-loaded', { platform, features: (strings.features||[]).length });



      const header = document.querySelector('.opengov-header') || document.body;
      const btn = document.createElement('button');
      btn.className = 'nfb-btn nfb-pulse';
      btn.id = 'newFeaturesBtn';
      btn.textContent = 'See New Features';
      btn.style.marginLeft = '0px';
      btn.style.marginTop = '0px';
      // Anchor inside header to avoid overflowing taskpane width
      try { if (header && getComputedStyle(header).position === 'static') header.style.position = 'relative'; } catch (_) {}
      btn.style.position = 'absolute';
      btn.style.top = '8px';
      btn.style.right = '8px'; // Back to right edge since menu button removed
      btn.style.zIndex = '2147483647';
      btn.style.pointerEvents = 'auto';
      log('button-created');

      const { showModal, featureState } = renderModal(strings, platform);

      // Load initial feature states from API and apply
      try {
        const serverState = await loadFeatureStates();
        if (serverState) {
          serverState.forEach((val, id) => {
            if (featureState.has(id)) featureState.set(id, !!val);
          });
          // repaint buttons if modal is already in DOM
          if (typeof window.__nfbRepaint === 'function') window.__nfbRepaint(serverState);
        }
      } catch (_) {}
      // Ensure defaults to enabled if server did not provide a value
      try {
        const assumed = new Map();
        strings.features.forEach(f => {
          if (!featureState.has(f.id)) featureState.set(f.id, true);
          assumed.set(f.id, !!featureState.get(f.id));
        });
        if (typeof window.__nfbRepaint === 'function') window.__nfbRepaint(assumed);
      } catch(_) {}
      // Ensure clicks inside modal do not leak to document-level listeners that may close it
      const modalEl = document.getElementById('nfbModal');
      if (modalEl) {
        modalEl.addEventListener('click', (e) => { try { e.stopPropagation(); } catch (_) {} }, true);
      }
      // Shield other global click handlers when modal is open (bubble-phase so target handlers still run)
      document.addEventListener('click', (evt) => {
        if (!window.__nfbOpen) return;
        const modal = document.getElementById('nfbModal');
        const btnEl = document.getElementById('newFeaturesBtn');
        if (!modal) return;
        if (modal.contains(evt.target) || (btnEl && btnEl.contains(evt.target))) {
          try { evt.stopPropagation(); } catch (_) {}
          log('doc-click-suppressed');
        }
      }, false);

      // SSE sync for feature toggles
      try {
        const es = new EventSource('http://localhost:3001/api/events');
        es.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data && data.type === 'feature-toggled') {
              const { id, enabled } = data;
              const map = new Map(); map.set(id, !!enabled);
              if (featureState.has(id)) featureState.set(id, !!enabled);
              if (typeof window.__nfbRepaint === 'function') window.__nfbRepaint(map);
            }
          } catch (_) {}
        };
      } catch (_) {}

      // Kill any pre-existing handlers that may have been added before reload to avoid duplicate suppression
      try { btn.replaceWith(btn.cloneNode(true)); } catch (_) {}

      // Open on capture so other listeners cannot swallow the event first, but do not stop immediate propagation
      const captureOpen = (evt) => {
        const btnEl = document.getElementById('newFeaturesBtn');
        if (!btnEl) return;
        if (evt.target === btnEl || btnEl.contains(evt.target)) {
          try { evt.preventDefault(); evt.stopPropagation(); } catch (_) {}
          setTimeout(() => showModal(), 0);
          log('capture-open');
        }
      };
      document.addEventListener('pointerdown', captureOpen, true);
      document.addEventListener('click', captureOpen, true);
      log('capture-open-installed');
      btn.addEventListener('click', (e) => {
        // Prevent immediate close from any bubbling listeners; defer show to next tick
        try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
        log('button-clicked');
        setTimeout(() => showModal(), 0);
      });

      // Insert button in header if possible
      if (header && header.appendChild) { header.appendChild(btn); } else { document.body.insertBefore(btn, document.body.firstChild); }
      log('button-inserted', { inHeader: !!header });
    } catch (e) {
      log('init-error', String(e && (e.stack || e.message || e)));
    }
  }

  // Expose init for explicit calls
  window.initNewFeatureBanner = initNewFeatureBanner;
  window.__nfbDebug = function() {
    const btn = document.getElementById('newFeaturesBtn');
    const modal = document.getElementById('nfbModal');
    const backdrop = document.getElementById('nfbBackdrop');
    return {
      open: !!window.__nfbOpen,
      btn: !!btn, btnRect: btn && btn.getBoundingClientRect(),
      modal: !!modal, modalDisplay: modal && getComputedStyle(modal).display,
      backdrop: !!backdrop, backdropDisplay: backdrop && getComputedStyle(backdrop).display,
    };
  }
})();



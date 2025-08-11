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
      'scripts/new-feature-banner-text.json',
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

  function ensureStyles() {
    if (document.getElementById('new-feature-banner-styles')) return;
    const style = document.createElement('style');
    style.id = 'new-feature-banner-styles';
    style.textContent = `
      .nfb-btn { background: #ff4d94; color: #fff; border: none; border-radius: 8px; padding: 8px 12px; font-weight: 600; cursor: pointer; }
      .nfb-btn:hover { background: #ff66a3; }
      .nfb-btn[disabled] { opacity: .55; cursor: default; }
      .nfb-btn-active { background: #ff2d80 !important; }
      /* Use extreme z-index to appear above any stacking contexts */
      .nfb-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: none; z-index: 2147483646; }
      .nfb-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; border-radius: 10px; width: min(700px, 92vw); max-height: 80vh; overflow: auto; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); display: none; z-index: 2147483647; opacity: 1; }
      /* Force-open safety (if other code toggles display) */
      html.nfb-is-open .nfb-modal { display: block !important; }
      html.nfb-is-open .nfb-modal-backdrop { display: block !important; }
      .nfb-modal-title { font-size: 18px; font-weight: 700; margin: 0 0 6px 0; }
      .nfb-modal-sub { font-size: 12px; color: #6c757d; margin: 0 0 12px 0; }
      .nfb-table { width: 100%; border-collapse: collapse; }
      .nfb-table th, .nfb-table td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; font-size: 14px; }
      .nfb-actions { display: flex; gap: 8px; }
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

  function renderModal(strings) {
    ensureStyles();

    const backdrop = document.createElement('div');
    backdrop.className = 'nfb-modal-backdrop';
    backdrop.id = 'nfbBackdrop';

    const modal = document.createElement('div');
    modal.className = 'nfb-modal';
    modal.id = 'nfbModal';

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

    strings.features.forEach(f => {
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
      const actions = document.createElement('div');
      actions.className = 'nfb-actions';
      const btnEnable = document.createElement('button');
      btnEnable.className = 'nfb-btn';
      btnEnable.textContent = strings.modal.buttons.enable;
      const btnDisable = document.createElement('button');
      btnDisable.className = 'nfb-btn';
      btnDisable.textContent = strings.modal.buttons.disable;

      function updateActionButtons() {
        const enabled = featureState.get(f.id);
        btnEnable.disabled = enabled === true;
        btnDisable.disabled = enabled === false;
        btnEnable.classList.toggle('nfb-btn-active', enabled === true);
        btnDisable.classList.toggle('nfb-btn-active', enabled === false);
        btnEnable.setAttribute('aria-pressed', String(enabled === true));
        btnDisable.setAttribute('aria-pressed', String(enabled === false));
      }

      btnEnable.addEventListener('click', () => {
        featureState.set(f.id, true);
        updateActionButtons();
        const msg = (strings.modal.notifications.toggledOn || 'Enabled: {{name}}').replace('{{name}}', f.name);
        notify(msg);
      });
      btnDisable.addEventListener('click', () => {
        featureState.set(f.id, false);
        updateActionButtons();
        const msg = (strings.modal.notifications.toggledOff || 'Disabled: {{name}}').replace('{{name}}', f.name);
        notify(msg);
      });

      actions.appendChild(btnEnable);
      actions.appendChild(btnDisable);
      tdActions.appendChild(actions);

      tr.appendChild(tdName);
      tr.appendChild(tdStatus);
      tr.appendChild(tdRelease);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);

      updateActionButtons();
    });

    table.appendChild(tbody);

    const footer = document.createElement('div');
    footer.className = 'nfb-footer';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'nfb-btn';
    closeBtn.textContent = strings.modal.buttons.close;
    closeBtn.addEventListener('click', () => hideModal());
    footer.appendChild(closeBtn);

    modal.appendChild(title);
    modal.appendChild(sub);
    modal.appendChild(table);
    modal.appendChild(footer);

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    log('modal-dom-ready', { hasBackdrop: !!document.getElementById('nfbBackdrop'), hasModal: !!document.getElementById('nfbModal') });

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

    return { showModal, hideModal };
  }

  async function initNewFeatureBanner(platform) {
    try {
      const strings = await loadStrings();
      if (!strings) { log('strings-load-failed'); return; }
      log('strings-loaded', { platform, features: (strings.features||[]).length });

      // Update badge label if present
      const badge = document.querySelector('.coming-soon-badge');
      if (badge) { badge.textContent = strings.banner.label || 'Coming soon'; log('badge-set', { text: badge.textContent }); }

      const header = document.querySelector('.opengov-header') || document.body;
      const btn = document.createElement('button');
      btn.className = 'nfb-btn';
      btn.id = 'newFeaturesBtn';
      btn.textContent = strings.banner.buttonLabel || 'New features';
      btn.style.marginLeft = '8px';
      btn.style.marginTop = '8px';
      // Place above all content to avoid overlay interception
      btn.style.position = 'fixed';
      btn.style.top = '8px';
      btn.style.right = '8px';
      btn.style.zIndex = '1000002';
      btn.style.pointerEvents = 'auto';
      log('button-created');

      const { showModal } = renderModal(strings);
      // Shield other global click handlers when modal is open or when the banner button is clicked
      document.addEventListener('click', (evt) => {
        if (!window.__nfbOpen) return;
        const modal = document.getElementById('nfbModal');
        const btnEl = document.getElementById('newFeaturesBtn');
        if (!modal) return;
        if (modal.contains(evt.target) || (btnEl && btnEl.contains(evt.target))) {
          try { evt.stopPropagation(); evt.stopImmediatePropagation(); } catch (_) {}
          log('doc-click-suppressed');
        }
      }, true);

      // Capture-phase opener so no other listener can swallow the event before us
      const captureOpen = (evt) => {
        const btnEl = document.getElementById('newFeaturesBtn');
        if (!btnEl) return;
        if (evt.target === btnEl || btnEl.contains(evt.target)) {
          try { evt.preventDefault(); evt.stopPropagation(); evt.stopImmediatePropagation(); } catch (_) {}
          setTimeout(() => showModal(), 0);
          log('capture-open');
        }
      };
      document.addEventListener('pointerdown', captureOpen, true);
      document.addEventListener('click', captureOpen, true);
      log('capture-open-installed');
      btn.addEventListener('click', (e) => {
        // Prevent immediate close from any bubbling listeners; defer show to next tick
        try { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); } catch (_) {}
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



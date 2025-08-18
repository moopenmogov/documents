/**
 * Shared State Matrix Client
 * Copied exactly from web viewer for consistency
 */

/**
 * Apply state matrix configuration to UI elements
 * Copied exactly from viewer.html applyStateMatrixToUI function
 */
function applyStateMatrixToUI(config) {
    // SIMPLIFIED: Only handle dropdowns and banners, no individual buttons
    // Individual buttons are handled by renderMatrixActionsDropdown() instead
    
    console.log('📋 Applying state matrix to UI:', config);
    // Disable View Latest when no document is loaded
    const viewOnlyBtn = document.getElementById('viewOnlyBtn');
    if (viewOnlyBtn && config.checkoutStatus) {
        const hasDocument = !!config.checkoutStatus.show;
        viewOnlyBtn.disabled = !hasDocument;
    }
    // Control visibility of the Document dropdown toggle based on nested actions
    const hasAnyDocAction = !!(
        config.buttons?.checkoutBtn ||
        config.buttons?.overrideBtn ||
        config.buttons?.checkedInBtns ||
        config.buttons?.sendVendorBtn ||
        config.buttons?.viewOnlyBtn ||
        config.buttons?.replaceDefaultBtn ||
        true /* approvals always */
    );
    const docToggle = document.getElementById('docActionsToggle');
    const docMenu = document.getElementById('docActionsMenu');
    if (docToggle) {
        docToggle.style.display = hasAnyDocAction ? 'inline-block' : 'none';
        // Ensure menu is closed if toggle is hidden
        if (!hasAnyDocAction && docMenu) {
            docMenu.style.display = 'none';
        }
    }
    // Grouped "checked in" buttons visibility
    const checkinBtn = document.getElementById('checkinBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveProgressBtn = document.getElementById('saveProgressBtn');
    const showCheckedIn = !!config.buttons.checkedInBtns;
    [checkinBtn, cancelBtn, saveProgressBtn].forEach(el => {
        if (el) el.style.display = showCheckedIn ? 'inline-block' : 'none';
    });
    
    // Apply checkout/finalize banner
    const checkoutStatus = document.getElementById('checkoutStatus');
    if (checkoutStatus) {
        const fin = config.finalize || {};
        if (fin.isFinal && fin.banner && fin.banner.text) {
            // Server-driven finalize banner (locked)
            checkoutStatus.textContent = fin.banner.text;
            checkoutStatus.style.display = 'block';
            // Colors from server
            try {
                checkoutStatus.style.backgroundColor = fin.banner.color || '#6b7280';
                checkoutStatus.style.color = fin.banner.textColor || '#ffffff';
                checkoutStatus.style.padding = '6px 11px';
                checkoutStatus.style.borderRadius = '4px';
                checkoutStatus.style.fontSize = '18px';
                checkoutStatus.style.fontWeight = '500';
                checkoutStatus.style.margin = '8px 0';
            } catch(_) {}
        } else if (config.checkoutStatus && config.checkoutStatus.show) {
            checkoutStatus.textContent = config.checkoutStatus.text;
            checkoutStatus.style.display = 'block';
            // Apply softer pink/teal directly via JavaScript (CSS specificity)
            if (config.checkoutStatus.text.includes('Checked out by')) {
                console.log('🔴 Applying medium blue background - text contains "Checked out by":', config.checkoutStatus.text);
                checkoutStatus.style.backgroundColor = '#3b82f6';
                checkoutStatus.style.color = 'white';
                checkoutStatus.style.padding = '6px 11px';
                checkoutStatus.style.borderRadius = '4px';
                checkoutStatus.style.fontSize = '18px';
                checkoutStatus.style.fontWeight = '500';
                checkoutStatus.style.margin = '8px 0';
                checkoutStatus.classList.add('checked-out');
                console.log('🎨 Applied medium blue checkout styling');
            } else {
                console.log('🔵 Applying light blue background - available state:', config.checkoutStatus.text);
                checkoutStatus.style.backgroundColor = '#bfdbfe';
                checkoutStatus.style.color = '#1e40af';
                checkoutStatus.style.padding = '6px 11px';
                checkoutStatus.style.borderRadius = '4px';
                checkoutStatus.style.fontSize = '18px';
                checkoutStatus.style.fontWeight = '500';
                checkoutStatus.style.margin = '8px 0';
                checkoutStatus.classList.remove('checked-out');
                console.log('🎨 Applied available blue checkout styling');
            }
        } else {
            checkoutStatus.style.display = 'none';
            checkoutStatus.textContent = '';
            checkoutStatus.classList.remove('checked-out');
        }
    }
    
    // Apply viewer message
    const viewerMessage = document.getElementById('viewerMessage');
    if (viewerMessage && config.viewerMessage) {
        if (config.viewerMessage.show) {
            viewerMessage.textContent = config.viewerMessage.text;
            viewerMessage.style.display = 'block';
        } else {
            viewerMessage.style.display = 'none';
            viewerMessage.textContent = '';
        }
    }
    
    // Legacy banner support (for any remaining old banners)
    const banner = document.getElementById('checkoutBanner');
    if (banner) {
        if (config.banner && config.banner.show && config.banner.text) {
            banner.textContent = config.banner.text;
            banner.style.display = 'block';
        } else {
            // Hide and clear text so tests don't flag stale content
            banner.style.display = 'none';
            banner.textContent = '';
        }
    }

    // Note: legacy dropdown refresh is handled in platform-specific updater
    // to avoid hiding controls prematurely in hosts with custom UI.
}

/**
 * Update UI based on state matrix API
 * Both platforms call this with their own helper functions
 */
async function updateUIFromStateMatrix(platform, getCurrentUser, getCurrentUserRole, currentDocumentState) {
    const userRole = getCurrentUserRole();
    const userId = getCurrentUser()?.id;
    // If user not yet loaded, defer until available to avoid 404s and bad state
    if (!userId) {
        try { console.log(`⏳ ${platform.toUpperCase()}: user not ready; deferring matrix update`); } catch(_) {}
        return;
    }
    const isCheckedOut = currentDocumentState?.isCheckedOut || false;
    const checkedOutBy = currentDocumentState?.checkedOutBy || null;
    
    console.log(`🎯 ${platform.toUpperCase()}: STATE MATRIX UPDATE:`, { userRole, platform, userId, isCheckedOut, checkedOutBy });
    
    try {
        const url = `http://localhost:3001/api/state-matrix?userRole=${userRole}&platform=${platform}&userId=${userId}&isCheckedOut=${isCheckedOut}&checkedOutBy=${checkedOutBy}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            const config = data.config;
            console.log(`📋 ${platform.toUpperCase()}: Matrix config from API:`, config);
            
            // Expose last state for UI components (e.g., approvals modal)
            window.__lastStateMatrix = config;
            
            // Trigger dropdown render for Word add-in when state matrix is ready
            if (platform === 'word' && typeof window.renderMatrixActionsDropdown === 'function') {
                try {
                    window.renderMatrixActionsDropdown(config);
                    console.log('🔄 TIMING FIX: Dropdown rendered immediately when state matrix loaded');
                } catch (e) {
                    console.warn('Dropdown render failed:', e);
                }
            }
            
            // Apply matrix to UI
            applyStateMatrixToUI(config);
            
            // SIMPLIFIED: Only use the unified dropdown approach
            // No more platform-specific renderers or legacy button systems
            
            console.log(`✅ ${platform.toUpperCase()}: State matrix applied to UI`);
        } else {
            console.error(`❌ ${platform.toUpperCase()}: State matrix API failed:`, data.error);
        }
    } catch (error) {
        console.error(`❌ ${platform.toUpperCase()}: Error calling state matrix API:`, error);
    }
}

// Expose refresh helper globally so pages can call it
window.refreshActionsDropdownFromMatrix = function(selectId, config) {
    const select = document.getElementById(selectId);
    if (!select || !config || !config.buttons) return;
    while (select.options.length > 1) select.remove(1);
    const actions = [];
    const add = (id, label, fn, include) => { if (include && typeof fn === 'function') actions.push({ id, label, fn }); };
    const b = config.buttons;
    const hasDoc = !!config.checkoutStatus?.show;

    // Build by server-provided order when available, else fallback
    const order = Array.isArray(config.dropdown?.order) ? config.dropdown.order : [
        'viewOnlyBtn','shareToWebBtn','templatesBtn','openGovBtn','checkoutBtn','checkinBtn','cancelBtn','saveProgressBtn','overrideBtn','sendVendorBtn','replaceDefaultBtn','compile','approvalsBtn','finalize','unfinalize'
    ];

    const map = {
        viewOnlyBtn: () => add('viewOnlyBtn', 'View Latest', window.viewLatestRobust || window.cleanViewLatest || window.viewReadOnly, hasDoc && (b.viewOnlyBtn !== false)),
        shareToWebBtn: () => add('shareToWebBtn', 'Open in Web', window.shareToWeb, true),
        checkoutBtn: () => add('checkoutBtn', 'Check-out Document', window.checkoutDocument, !!b.checkoutBtn),
        checkinBtn: () => add('checkinBtn', 'Save & Check-in', window.checkinDocument, !!b.checkedInBtns),
        cancelBtn: () => add('cancelBtn', 'Cancel Check-out', window.cancelCheckout, !!b.checkedInBtns),
        saveProgressBtn: () => add('saveProgressBtn', 'Save Progress', window.saveProgress, !!b.checkedInBtns),
        overrideBtn: () => add('overrideBtn', 'Override Check-out', window.overrideCheckout, !!b.overrideBtn),
        sendVendorBtn: () => add('sendVendorBtn', 'Send to Vendor', window.openVendorModal, !!b.sendVendorBtn),
        templatesBtn: () => add('templatesBtn', 'Templates', () => { try { (window.openTemplatesModal && window.openTemplatesModal()) || (window.openTemplatesModalWeb && window.openTemplatesModalWeb()); } catch(_) {} }, !!b.templatesBtn),
        openGovBtn: () => add('openGovBtn', 'Take Me Back to OpenGov', () => { try { window.openOpenGovModal && window.openOpenGovModal(); } catch(_) {} }, !!b.openGovBtn),
        replaceDefaultBtn: () => add('replaceDefaultBtn', 'Open new document', () => {
            try {
                const fileEl = document.getElementById('fileInput') || document.getElementById('replaceCurrentDocFileInput') || document.getElementById('inputReplaceCurrent');
                if (fileEl && typeof fileEl.click === 'function') fileEl.click();
            } catch(_) {}
        }, !!b.replaceDefaultBtn),
        compile: () => add('compile', 'Compile', () => {
            try { (window.onWebDocActionChange && window.onWebDocActionChange('compile')) || (window.openCompileModal && window.openCompileModal()); } catch(_){}
        }, !!b.compileBtn),
        approvalsBtn: () => add('approvalsBtn', 'Approvals', () => {
            const fn = (window.openApprovalsModalWord || window.openApprovalsModal || window.openApprovalsModalWeb);
            if (typeof fn === 'function') {
                try { fn(); } catch (e) { console.error('Approvals open error:', e); }
            } else {
                console.warn('Approvals opener not available');
            }
        }, true),
        finalize: () => add('finalize', 'Finalize', async () => { try { window.onWebDocActionChange && window.onWebDocActionChange('finalize'); } catch(_) {} }, !!b.finalizeBtn),
        unfinalize: () => add('unfinalize', 'Unlock', async () => { try { window.onWebDocActionChange && window.onWebDocActionChange('unfinalize'); } catch(_) {} }, !!b.unfinalizeBtn)
    };

    order.forEach(key => { if (map[key]) map[key](); });

    actions.forEach(a => { const opt = document.createElement('option'); opt.value = a.id; opt.textContent = a.label; select.appendChild(opt); });
    const wrapper = select.parentElement || select;
    wrapper.style.display = actions.length ? 'block' : 'none';
    select.onchange = (e) => { const val = e.target.value; if (!val) return; const a = actions.find(x => x.id === val); if (a) a.fn(); select.value = ''; };
}

// Populate a select dropdown with currently available document actions by inspecting visible buttons
function refreshActionsDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    // Clear options except placeholder
    while (select.options.length > 1) select.remove(1);

    const actions = [];
    const add = (id, label, fn, visible) => { if (visible && typeof fn === 'function') actions.push({ id, label, fn }); };

    const el = (id) => document.getElementById(id);
    const isVisible = (id) => {
        const n = el(id);
        return !!(n && n.style.display !== 'none' && n.offsetParent !== null);
    };

    // Build from current DOM visibility
    add('viewOnlyBtn', 'View Latest', window.viewReadOnly, !!el('viewOnlyBtn') && !el('viewOnlyBtn').disabled);
    add('shareToWebBtn', 'Open in Web', window.shareToWeb, !!el('shareToWebBtn'));
    add('checkoutBtn', 'Check-out Document', window.checkoutDocument, isVisible('checkoutBtn'));
    add('checkinBtn', 'Save & Check-in', window.checkinDocument, isVisible('checkinBtn'));
    add('cancelBtn', 'Cancel Check-out', window.cancelCheckout, isVisible('cancelBtn'));
    add('saveProgressBtn', 'Save Progress', window.saveProgress, isVisible('saveProgressBtn'));
    add('overrideBtn', 'Override Check-out', window.overrideCheckout, isVisible('overrideBtn'));
    add('sendVendorBtn', 'Send to Vendor', window.openVendorModal, isVisible('sendVendorBtn'));

    actions.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.label;
        select.appendChild(opt);
    });

    select.parentElement.style.display = actions.length ? 'block' : 'none';
    select.onchange = (e) => {
        const val = e.target.value;
        if (!val) return;
        const a = actions.find(x => x.id === val);
        if (a) a.fn();
        select.value = '';
    };
}

/**
 * Shared finalize/unfinalize confirmation modal for both web and add-in
 * Usage: await window.openFinalizeToggleModal('finalize'|'unfinalize', meta)
 * Returns: Promise<boolean> (true when confirmed)
 */
window.openFinalizeToggleModal = function openFinalizeToggleModal(mode, meta) {
    try {
        const isUn = (mode === 'unfinalize');
        const title = (meta && meta.title) || (isUn ? 'Move back to Draft?' : "Please confirm you'd like to finalize.");
        const body = (meta && meta.body) || (isUn ? 'Editors can edit again; approvals may need to be re-requested.' : 'After finalizing, the document is locked and the first approver is notified.');
        const label = (meta && meta.confirmLabel) || (isUn ? 'Move to Draft' : 'Finalize');
        const tone = (meta && meta.toneColor) || '#fff3cd';
        const toneText = (meta && meta.toneTextColor) || '#111827';

        return new Promise((resolve) => {
            const host = document.body;
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:2147483646;display:flex;align-items:center;justify-content:center;';
            const modal = document.createElement('div');
            modal.id = 'ogFinalize';
            modal.style.cssText = 'background:#fff;border-radius:8px;min-width:360px;max-width:520px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,0.2);';
            const style = document.createElement('style');
            style.textContent = '#ogFinalize .btn{background:#1f2937 !important;color:#fff !important;border:none !important;border-radius:6px !important;padding:8px 12px !important;} #ogFinalize .btn-cancel{background:#e5e7eb !important;color:#000 !important;border:1px solid #d1d5db !important;border-radius:6px !important;padding:8px 12px !important;}';
            const hdr = document.createElement('div'); hdr.textContent = title; hdr.style.cssText='font-weight:600;font-size:16px;margin-bottom:8px;';
            const msg = document.createElement('div'); msg.textContent = body; msg.style.cssText='border-radius:6px;padding:8px 10px;margin-bottom:10px;'; msg.style.background = tone; msg.style.color = toneText;
            const actions = document.createElement('div'); actions.style.cssText='display:flex;gap:8px;justify-content:flex-end;';
            const btnCancel = document.createElement('button'); btnCancel.textContent = 'Cancel'; btnCancel.className='btn-cancel';
            const btnConfirm = document.createElement('button'); btnConfirm.textContent = label; btnConfirm.className='btn';
            actions.appendChild(btnCancel); actions.appendChild(btnConfirm);
            modal.appendChild(style); modal.appendChild(hdr); modal.appendChild(msg); modal.appendChild(actions); overlay.appendChild(modal); host.appendChild(overlay);
            const cleanup = (val) => { try { overlay.remove(); } catch(_) {} resolve(val); };
            btnCancel.onclick = () => cleanup(false);
            btnConfirm.onclick = () => cleanup(true);
        });
    } catch(_) {
        return Promise.resolve(false);
    }
};

/**
 * Shared State Matrix Client
 * Copied exactly from web viewer for consistency
 */

/**
 * Apply state matrix configuration to UI elements
 * Copied exactly from viewer.html applyStateMatrixToUI function
 */
function applyStateMatrixToUI(config) {
    // Apply button visibility - EXACT copy from web viewer
    const buttonMap = {
        checkoutBtn: config.buttons.checkoutBtn,
        overrideBtn: config.buttons.overrideBtn,
        sendVendorBtn: config.buttons.sendVendorBtn,
        saveProgressBtn: config.buttons.checkedInBtns,
        checkinBtn: config.buttons.checkedInBtns,
        cancelBtn: config.buttons.checkedInBtns,
        viewOnlyBtn: config.buttons.viewOnlyBtn
    };
    
    Object.entries(buttonMap).forEach(([buttonId, shouldShow]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = shouldShow ? 'inline-block' : 'none';
        }
    });
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
        config.buttons?.viewOnlyBtn
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
    
    // Apply checkout status banner
    const checkoutStatus = document.getElementById('checkoutStatus');
    if (checkoutStatus && config.checkoutStatus) {
        if (config.checkoutStatus.show) {
            checkoutStatus.textContent = config.checkoutStatus.text;
            checkoutStatus.style.display = 'block';
            
            // Apply softer pink/teal directly via JavaScript (CSS specificity)
            if (config.checkoutStatus.text.includes('Checked out by')) {
                console.log('🔴 Applying pink background - text contains "Checked out by":', config.checkoutStatus.text);
                checkoutStatus.style.backgroundColor = '#ff6fa5';
                checkoutStatus.style.color = 'white';
                checkoutStatus.style.padding = '8px 16px';
                checkoutStatus.style.borderRadius = '4px';
                checkoutStatus.style.fontSize = '18px';
                checkoutStatus.style.fontWeight = '500';
                checkoutStatus.style.margin = '8px 0';
                checkoutStatus.classList.add('checked-out');
                console.log('🎨 Applied pink checkout styling');
            } else {
                console.log('🔵 Applying soft pink background - available state:', config.checkoutStatus.text);
                checkoutStatus.style.backgroundColor = '#ffc1d9';
                checkoutStatus.style.color = 'white';
                checkoutStatus.style.padding = '8px 16px';
                checkoutStatus.style.borderRadius = '4px';
                checkoutStatus.style.fontSize = '18px';
                checkoutStatus.style.fontWeight = '500';
                checkoutStatus.style.margin = '8px 0';
                checkoutStatus.classList.remove('checked-out');
                console.log('🎨 Applied available checkout styling');
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

    // After applying visibility, refresh any dynamic document actions dropdowns
    try { refreshActionsDropdown('docActionsSelect'); } catch (e) {}
    try { refreshActionsDropdown('webDocActionsSelect'); } catch (e) {}
}

/**
 * Update UI based on state matrix API
 * Both platforms call this with their own helper functions
 */
async function updateUIFromStateMatrix(platform, getCurrentUser, getCurrentUserRole, currentDocumentState) {
    const userRole = getCurrentUserRole();
    const userId = getCurrentUser()?.id;
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
            // Apply matrix to UI
            applyStateMatrixToUI(config);
            
            // After applying, refresh platform-specific action dropdowns if present
            try { if (platform === 'word') refreshActionsDropdownFromMatrix('docActionsSelect', config); } catch (e) {}
            try { if (platform === 'web') refreshActionsDropdownFromMatrix('webDocActionsSelect', config); } catch (e) {}
            
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
    add('viewOnlyBtn', 'View Latest', window.viewLatestSafe || window.cleanViewLatest || window.viewReadOnly, hasDoc && (b.viewOnlyBtn !== false));
    add('shareToWebBtn', 'Open in Web', window.shareToWeb, true);
    add('checkoutBtn', 'Check-out Document', window.checkoutDocument, !!b.checkoutBtn);
    add('checkinBtn', 'Save & Check-in', window.checkinDocument, !!b.checkedInBtns);
    add('cancelBtn', 'Cancel Check-out', window.cancelCheckout, !!b.checkedInBtns);
    add('saveProgressBtn', 'Save Progress', window.saveProgress, !!b.checkedInBtns);
    add('overrideBtn', 'Override Check-out', window.overrideCheckout, !!b.overrideBtn);
    add('sendVendorBtn', 'Send to Vendor', window.openVendorModal, !!b.sendVendorBtn);
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

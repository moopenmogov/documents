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
        overrideBtn: config.buttons.overrideBtn,        // Both platforms now use this ID
        sendVendorBtn: config.buttons.sendVendorBtn,
        saveProgressBtn: config.buttons.checkedInBtns,
        checkinBtn: config.buttons.checkedInBtns,
        cancelBtn: config.buttons.checkedInBtns,
        viewOnlyBtn: false // Not in our matrix
    };
    
    Object.entries(buttonMap).forEach(([buttonId, shouldShow]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = shouldShow ? 'inline-block' : 'none';
        }
    });
    
    // Apply checkout status banner
    const checkoutStatus = document.getElementById('checkoutStatus');
    if (checkoutStatus && config.checkoutStatus) {
        if (config.checkoutStatus.show) {
            checkoutStatus.textContent = config.checkoutStatus.text;
            checkoutStatus.style.display = 'block';
            
            // Add checked-out class for red styling when document is checked out
            if (config.checkoutStatus.text.includes('Checked out by')) {
                checkoutStatus.classList.add('checked-out');
            } else {
                checkoutStatus.classList.remove('checked-out');
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
            
            // Use the exact same applyStateMatrixToUI function as web viewer
            applyStateMatrixToUI(config);
            
            console.log(`✅ ${platform.toUpperCase()}: State matrix applied to UI`);
        } else {
            console.error(`❌ ${platform.toUpperCase()}: State matrix API failed:`, data.error);
        }
    } catch (error) {
        console.error(`❌ ${platform.toUpperCase()}: Error calling state matrix API:`, error);
    }
}

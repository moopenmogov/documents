// ===== STATE MATRIX API =====

/**
 * State Matrix API Endpoint
 * Implements the logic from USER_STATE_MATRIX.md as a shared service
 * GET /api/state-matrix?userRole=editor&platform=web&userId=user1
 * Returns { buttons: {...}, banner: { text, show } }
 */
app.get('/api/state-matrix', (req, res) => {
    const { userRole, platform, userId } = req.query;
    
    if (!userRole || !platform || !userId) {
        return res.status(400).json({ 
            error: 'Missing required parameters: userRole, platform, userId' 
        });
    }
    
    // Get current user info
    const users = platform === 'web' ? webUsers : wordUsers;
    const currentUser = users[userId];
    
    if (!currentUser) {
        return res.status(404).json({ 
            error: `User ${userId} not found on platform ${platform}` 
        });
    }
    
    // Get document state - fix variable name conflict
    const docState = {
        isCheckedOut: documentState.isCheckedOut || false,
        checkedOutBy: documentState.checkedOutBy || null,
        checkedOutUser: documentState.checkedOutUser || null
    };
    
    // Calculate state matrix configuration
    const config = getStateMatrixConfig(userRole, platform, docState, currentUser);
    
    res.json({
        success: true,
        config,
        meta: {
            userRole,
            platform,
            userId,
            documentState: docState
        }
    });
});

/**
 * Core state matrix logic - implements USER_STATE_MATRIX.md
 * @param {string} userRole - viewer, editor, suggester, vendor
 * @param {string} platform - web, word  
 * @param {object} docState - { isCheckedOut, checkedOutBy, checkedOutUser }
 * @param {object} currentUser - current user object
 * @returns {object} { buttons: {...}, banner: { text, show } }
 */
function getStateMatrixConfig(userRole, platform, docState, currentUser) {
    const { isCheckedOut, checkedOutBy, checkedOutUser } = docState;
    
    // Determine if this is self-checkout
    const isSelfCheckout = isCheckedOut && (
        (checkedOutBy === platform && checkedOutUser?.id === currentUser?.id) ||
        (checkedOutBy === 'vendor' && currentUser?.role === 'vendor' && checkedOutUser?.id === currentUser?.id)
    );
    
    // Initialize result
    const result = {
        buttons: {
            checkoutBtn: false,
            overrideBtn: false, 
            sendVendorBtn: false,
            checkedInBtns: false // saveProgressBtn, checkinBtn, cancelBtn
        },
        banner: {
            text: '',
            show: false
        }
    };
    
    // VIEWERS - Always read-only, role-specific banners
    if (userRole === 'viewer') {
        result.banner.show = true;
        if (!isCheckedOut) {
            result.banner.text = 'u no change this';
        } else if (checkedOutBy === 'word' && platform === 'web') {
            result.banner.text = 'u no change this - also checked out by word';
        } else if (checkedOutBy === 'web' && platform === 'word') {
            result.banner.text = 'web has the doc locked up';
        } else if (checkedOutBy === 'web' && platform === 'web') {
            result.banner.text = 'u no change this - doc checked out';
        } else if (checkedOutBy === 'word' && platform === 'word') {
            result.banner.text = 'another word user has doc';
        } else if (checkedOutBy === 'vendor') {
            result.banner.text = 'vendor be redlining';
        }
        return result; // Viewers get no buttons
    }
    
    // EDITORS - Full privileges, can override others
    if (userRole === 'editor') {
        if (!isCheckedOut) {
            // Available: checkout + send vendor
            result.buttons.checkoutBtn = true;
            result.buttons.sendVendorBtn = true;
        } else if (isSelfCheckout) {
            // Self checkout: checked-in buttons only
            result.buttons.checkedInBtns = true;
        } else {
            // Someone else has checkout: override + appropriate banner
            result.buttons.overrideBtn = true;
            result.banner.show = true;
            
            if (checkedOutBy === 'word' && platform === 'web') {
                result.banner.text = "YA CAN'T SAVE HERE FORREST -- WORD GOT YA DOC!";
            } else if (checkedOutBy === 'web' && platform === 'word') {
                result.banner.text = 'web viewer has doc locked';
            } else if (checkedOutBy === 'web' && platform === 'web') {
                result.banner.text = 'doc doc u ... right here right meow';
            } else if (checkedOutBy === 'word' && platform === 'word') {
                result.banner.text = 'another word user has doc';
            } else if (checkedOutBy === 'vendor') {
                result.banner.text = 'vendor be redlining';
            }
        }
        return result;
    }
    
    // SUGGESTERS & VENDORS - Can checkout, no override privilege
    if (userRole === 'suggester' || userRole === 'vendor') {
        if (!isCheckedOut) {
            // Available: checkout only (no send vendor for non-editors)
            result.buttons.checkoutBtn = true;
        } else if (isSelfCheckout) {
            // Self checkout: checked-in buttons only
            result.buttons.checkedInBtns = true;
        } else {
            // Someone else has checkout: banner only, NO override
            result.banner.show = true;
            
            if (checkedOutBy === 'word' && platform === 'web') {
                result.banner.text = "YA CAN'T SAVE HERE FORREST -- WORD GOT YA DOC!";
            } else if (checkedOutBy === 'web' && platform === 'word') {
                result.banner.text = 'web viewer has doc locked';
            } else if (checkedOutBy === 'web' && platform === 'web') {
                result.banner.text = 'doc doc u ... right here right meow';
            } else if (checkedOutBy === 'word' && platform === 'word') {
                result.banner.text = 'another word user has doc';
            } else if (checkedOutBy === 'vendor') {
                result.banner.text = 'vendor be redlining';
            }
        }
        return result;
    }
    
    // Fallback for unknown roles
    console.warn(`⚠️ Unknown user role: ${userRole}`);
    return result;
}

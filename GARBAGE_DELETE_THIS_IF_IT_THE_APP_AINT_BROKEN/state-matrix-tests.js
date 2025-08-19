/**
 * Automated State Matrix Testing Suite
 * Tests the implementation against USER_STATE_MATRIX.md specification
 */

/**
 * Main test runner - validates all user roles and document states
 */
function testStateMatrix() {
    console.log('🧪 STATE MATRIX VALIDATION');
    console.log('='.repeat(60));
    
    let totalTests = 0;
    let passedTests = 0;
    
    // Test all user roles on web platform
    const results = [
        ...testWebViewer(),
        ...testWebEditor(),
        ...testWebSuggester(),
        ...testWebVendor()
    ];
    
    results.forEach(result => {
        totalTests++;
        if (result.pass) passedTests++;
    });
    
    console.log('='.repeat(60));
    console.log(`📊 SUMMARY: ${passedTests}/${totalTests} tests passed`);
    console.log(passedTests === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    return results;
}

function testWebViewer() {
    console.log('\n👁️ WEB VIEWER TESTS:');
    
    const tests = [
        { 
            name: 'Available',
            state: { isCheckedOut: false, checkedOutBy: null, checkedOutUser: null },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: 'u no change this' }
        },
        { 
            name: 'Word Checkout',
            state: { isCheckedOut: true, checkedOutBy: 'word', checkedOutUser: 'word-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: 'u no change this - also checked out by word' }
        },
        { 
            name: 'Web Checkout (other)',
            state: { isCheckedOut: true, checkedOutBy: 'web', checkedOutUser: 'other-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: 'u no change this - doc checked out' }
        },
        { 
            name: 'Vendor Checkout',
            state: { isCheckedOut: true, checkedOutBy: 'vendor', checkedOutUser: 'vendor-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: 'vendor be redlining' }
        }
    ];
    
    return tests.map(test => validateStateTest('viewer', 'web', test));
}

function testWebEditor() {
    console.log('\n✏️ WEB EDITOR TESTS:');
    
    const tests = [
        { 
            name: 'Available',
            state: { isCheckedOut: false, checkedOutBy: null, checkedOutUser: null },
            expected: { checkoutBtn: true, overrideBtn: false, sendVendorBtn: true, checkedInBtns: false, banner: false }
        },
        { 
            name: 'Word Checkout',
            state: { isCheckedOut: true, checkedOutBy: 'word', checkedOutUser: 'word-user' },
            expected: { checkoutBtn: false, overrideBtn: true, sendVendorBtn: false, checkedInBtns: false, banner: "YA CAN'T SAVE HERE FORREST -- WORD GOT YA DOC!" }
        },
        { 
            name: 'Web Checkout (self)',
            state: { isCheckedOut: true, checkedOutBy: 'web', checkedOutUser: 'current-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: true, banner: false }
        },
        { 
            name: 'Web Checkout (other)',
            state: { isCheckedOut: true, checkedOutBy: 'web', checkedOutUser: 'other-user' },
            expected: { checkoutBtn: false, overrideBtn: true, sendVendorBtn: false, checkedInBtns: false, banner: 'doc doc u ... right here right meow' }
        },
        { 
            name: 'Vendor Checkout',
            state: { isCheckedOut: true, checkedOutBy: 'vendor', checkedOutUser: 'vendor-user' },
            expected: { checkoutBtn: false, overrideBtn: true, sendVendorBtn: false, checkedInBtns: false, banner: 'vendor be redlining' }
        }
    ];
    
    return tests.map(test => validateStateTest('editor', 'web', test));
}

function testWebSuggester() {
    console.log('\n💭 WEB SUGGESTER TESTS:');
    
    const tests = [
        { 
            name: 'Available',
            state: { isCheckedOut: false, checkedOutBy: null, checkedOutUser: null },
            expected: { checkoutBtn: true, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: false }
        },
        { 
            name: 'Word Checkout',
            state: { isCheckedOut: true, checkedOutBy: 'word', checkedOutUser: 'word-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: "YA CAN'T SAVE HERE FORREST -- WORD GOT YA DOC!" }
        },
        { 
            name: 'Web Checkout (self)',
            state: { isCheckedOut: true, checkedOutBy: 'web', checkedOutUser: 'current-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: true, banner: false }
        },
        { 
            name: 'Web Checkout (other)',
            state: { isCheckedOut: true, checkedOutBy: 'web', checkedOutUser: 'other-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: 'doc doc u ... right here right meow' }
        },
        { 
            name: 'Vendor Checkout',
            state: { isCheckedOut: true, checkedOutBy: 'vendor', checkedOutUser: 'vendor-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: 'vendor be redlining' }
        }
    ];
    
    return tests.map(test => validateStateTest('suggester', 'web', test));
}

function testWebVendor() {
    console.log('\n🏪 WEB VENDOR TESTS:');
    
    const tests = [
        { 
            name: 'Available',
            state: { isCheckedOut: false, checkedOutBy: null, checkedOutUser: null },
            expected: { checkoutBtn: true, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: false }
        },
        { 
            name: 'Web Checkout (self)',
            state: { isCheckedOut: true, checkedOutBy: 'web', checkedOutUser: 'current-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: true, banner: false }
        },
        { 
            name: 'Vendor Checkout',
            state: { isCheckedOut: true, checkedOutBy: 'vendor', checkedOutUser: 'vendor-user' },
            expected: { checkoutBtn: false, overrideBtn: false, sendVendorBtn: false, checkedInBtns: false, banner: 'vendor be redlining' }
        }
    ];
    
    return tests.map(test => validateStateTest('vendor', 'web', test));
}

/**
 * Validate a single state test case
 */
function validateStateTest(userRole, platform, testCase) {
    // Mock current user for self-checkout detection
    const originalGetCurrentUser = window.getCurrentUser;
    window.getCurrentUser = () => ({ id: 'current-user' });
    
    const result = window.getStateMatrixConfig(userRole, platform, testCase.state);
    const expected = testCase.expected;
    
    // Check buttons
    const buttonsMatch = 
        result.buttons.checkoutBtn === expected.checkoutBtn &&
        result.buttons.overrideBtn === expected.overrideBtn &&
        result.buttons.sendVendorBtn === expected.sendVendorBtn &&
        result.buttons.checkedInBtns === expected.checkedInBtns;
    
    // Check banner
    const bannerMatch = expected.banner === false ? 
        !result.banner.show :
        (result.banner.show && result.banner.text === expected.banner);
    
    const pass = buttonsMatch && bannerMatch;
    
    // Restore original function
    window.getCurrentUser = originalGetCurrentUser;
    
    // Format output with visual symbols
    const symbols = {
        checkout: result.buttons.checkoutBtn ? '🔄✓' : '🔄✗',
        override: result.buttons.overrideBtn ? '🔓✓' : '🔓✗', 
        vendor: result.buttons.sendVendorBtn ? '📤✓' : '📤✗',
        checkedIn: result.buttons.checkedInBtns ? '💾✓' : '💾✗',
        banner: result.banner.show ? `📢"${result.banner.text.substring(0,20)}..."` : '📢✗'
    };
    
    const resultStr = `${symbols.checkout} ${symbols.override} ${symbols.vendor} ${symbols.checkedIn} ${symbols.banner}`;
    
    console.log(`${pass ? '✅' : '❌'} ${testCase.name}: ${resultStr}`);
    
    if (!pass) {
        console.log(`   Expected: checkout:${expected.checkoutBtn} override:${expected.overrideBtn} vendor:${expected.sendVendorBtn} checkedIn:${expected.checkedInBtns}`);
        console.log(`   Expected banner: "${expected.banner}"`);
        console.log(`   Actual banner: "${result.banner.text}" (show: ${result.banner.show})`);
    }
    
    return { pass, userRole, platform, testCase, result, expected };
}

/**
 * Debug current state vs expected - for live testing
 */
async function debugStateMatrixLive() {
    if (!window.getCurrentUserRole || !window.getStateMatrixConfig) {
        console.error('❌ State matrix functions not available. Make sure viewer.html is loaded.');
        return;
    }
    
    // Ensure we have the freshest status before comparing
    if (typeof window.fetchDocumentStatus === 'function') {
        try {
            await window.fetchDocumentStatus();
        } catch (e) {
            console.warn('⚠️ Failed to prefetch status for live debug:', e);
        }
    }
    if (typeof window.updateButtonStates === 'function') {
        try { window.updateButtonStates(); } catch (e) {}
    }

    const userRole = window.getCurrentUserRole();
    const platform = 'web';
    const documentState = {
        isCheckedOut: window.currentDocumentState?.isCheckedOut || false,
        checkedOutBy: window.currentDocumentState?.checkedOutBy || null,
        checkedOutUser: window.currentDocumentState?.checkedOutUser || null
    };
    
    console.log('🔍 LIVE STATE MATRIX DEBUG');
    console.log('='.repeat(40));
    
    const expected = window.getStateMatrixConfig(userRole, platform, documentState);
    const actual = getCurrentUIState();
    
    console.log('📋 Current State:', { userRole, platform, documentState });
    console.log('📋 Expected Config:', expected);
    console.log('📋 Actual UI State:', actual);
    
    // Visual comparison
    console.table({
        'Expected Buttons': expected.buttons,
        'Actual Buttons': actual.buttons
    });
    
    const buttonsMatch = JSON.stringify(expected.buttons) === JSON.stringify(actual.buttons);
    const bannerMatch = expected.banner.text === actual.banner.text && expected.banner.show === actual.banner.show;
    const matches = buttonsMatch && bannerMatch;
    
    console.log(`\n${matches ? '✅ PERFECT MATCH' : '❌ MISMATCH DETECTED'}`);
    if (!matches) {
        console.log('🔍 Differences:');
        if (!buttonsMatch) console.log('  - Button states differ');
        if (!bannerMatch) console.log('  - Banner states differ');
    }
    
    return { expected, actual, matches };
}

/**
 * Get current UI state for comparison
 */
function getCurrentUIState() {
    const getButtonState = (id) => {
        const btn = document.getElementById(id);
        return btn ? btn.style.display !== 'none' : false;
    };
    
    const banner = document.getElementById('checkoutBanner');
    
    return {
        buttons: {
            checkoutBtn: getButtonState('checkoutBtn'),
            overrideBtn: getButtonState('overrideVendorBtn'),
            sendVendorBtn: getButtonState('sendVendorBtn'),
            checkedInBtns: getButtonState('saveProgressBtn') || getButtonState('checkinBtn') || getButtonState('cancelBtn')
        },
        banner: {
            text: banner ? banner.textContent : '',
            show: banner ? banner.style.display !== 'none' : false
        }
    };
}

// Make functions globally available
window.testStateMatrix = testStateMatrix;
window.debugStateMatrixLive = debugStateMatrixLive;

console.log('🧪 State Matrix Test Suite loaded. Use testStateMatrix() or debugStateMatrixLive()');

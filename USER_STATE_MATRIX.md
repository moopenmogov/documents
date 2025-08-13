# User State Matrix Documentation

## Overview

This document defines the complete state matrix for the Document Collaboration Tool, specifying exactly which UI elements (banners, buttons) should be visible for each combination of user role, platform, and document checkout state.

## Key Principles

1. **Viewer Role**: Viewers cannot check out documents
2. **Self-Checkout Management**: Users manage their own checkouts with Save/Checkin/Cancel buttons
3. **Override Privilege**: **ONLY EDITORS** can override other users' checkouts
4. **No Suggester Override**: Suggesters can check out but cannot override others
5. **Send Vendor**: Only editors can send documents to vendors
6. **Override = Cancel**: Override does the same thing as cancel check-in without saving
7. **Vendor Placeholder**: Vendor button currently does nothing (future implementation)

## Button Definitions

- **Checkout Btn**: Check-out Document (initial checkout)
- **Override Btn**: Override others' checkout (editors only, same as cancel without save)
- **Send Vendor Btn**: Send to Vendor (editors only, currently placeholder)
- **Checked-In Btns**: Save Progress / Save & Check-in / Cancel Check-in (for self-checkout)

---

## 🌐 Web Viewer State Matrix

| Web User Role | Document State | Banner | Checkout Btn | Override Btn | Send Vendor Btn | Checked-In Btns |
|---------------|----------------|--------|--------------|-------------|-----------------|-----------------|
| **Web Viewer** | Any | Viewer Read-Only | ❌ | ❌ | ❌ | ❌ |
| **Web Editor** | Available | Available for checkout | ✅ | ❌ | ✅ | ❌ |
| **Web Editor** | Web Checkout (self) | Checked out by you | ❌ | ❌ | ❌ | ✅ |
| **Web Editor** | Web/Word/Vendor Checkout (other) | Checked out by <platform/user> | ❌ | ✅ | ❌ | ❌ |
| **Web Suggester** | Available | Available for checkout | ✅ | ❌ | ❌ | ❌ |
| **Web Suggester** | Web/Word/Vendor Checkout | Checked out by <platform/user> | ❌ | ❌ | ❌ | (self only) ✅ |
| **Web Vendor** | Available | Available for checkout | ✅ | ❌ | ❌ | ❌ |
| **Web Vendor** | Web/Word/Vendor Checkout | Checked out by <platform/user> | ❌ | ❌ | ❌ | (self only) ✅ |

---

## 📝 Word Add-in State Matrix

| Word User Role | Document State | Banner | Checkout Btn | Override Btn | Send Vendor Btn | Checked-In Btns |
|----------------|----------------|--------|--------------|-------------|-----------------|-----------------|
| **Word Viewer** | Any | Viewer Read-Only | ❌ | ❌ | ❌ | ❌ |
| **Word Editor** | Available | Available for checkout | ✅ | ❌ | ✅ | ❌ |
| **Word Editor** | Word Checkout (self) | Checked out by you | ❌ | ❌ | ❌ | ✅ |
| **Word Editor** | Web/Word/Vendor Checkout (other) | Checked out by <platform/user> | ❌ | ✅ | ❌ | ❌ |
| **Word Suggester** | Available | Available for checkout | ✅ | ❌ | ❌ | ❌ |
| **Word Suggester** | Web/Word/Vendor Checkout | Checked out by <platform/user> | ❌ | ❌ | ❌ | (self only) ✅ |
| **Word Vendor** | Available | Available for checkout | ✅ | ❌ | ❌ | ❌ |
| **Word Vendor** | Web/Word/Vendor Checkout | Checked out by <platform/user> | ❌ | ❌ | ❌ | (self only) ✅ |

---

## Implementation Notes

### Override Button Logic
```javascript
// Show override button only for editors when someone else has checkout
if (userRole === 'editor' && 
    isCheckedOut && 
    (checkedOutBy !== currentPlatform || checkedOutUser !== currentUser)) {
    showOverrideButton();
}
```

### Vendor Button Logic
```javascript
// Vendor button placeholder (currently does nothing)
function openVendorModal() {
    console.log("📤 Vendor button clicked - no action implemented yet");
    // TODO: Implement vendor workflow
}
```

### Platform Detection
- **Web Platform**: `checkedOutBy === 'web'`
- **Word Platform**: `checkedOutBy === 'word'`  
- **Vendor Platform**: `checkedOutBy === 'vendor'`

### Missing Implementation Requirements
1. **Word Suggester User**: Add to api-server.js wordUsers
2. **Word Vendor User**: Add to api-server.js wordUsers
3. **Platform-Aware Banner Messages**: Detect platform and show appropriate messages
4. **Vendor Workflow**: Implement actual vendor functionality

---

## State Validation Rules

1. **Impossible States**: 
   - Viewers cannot check out from their own platform
   - Users cannot see override for their own checkout

2. **Required States**:
   - All users see appropriate banners for their access level
   - Only editors can override others' checkouts
   - Only editors can send to vendor

3. **Button Mutual Exclusivity**:
   - Checkout button OR Checked-in buttons (never both)
   - Override button only when cannot checkout
   - Send vendor only when not checked out

---

## Testing Scenarios

### Cross-Platform Testing
1. Web editor + Word checkout → Override button + appropriate banner
2. Word editor + Web checkout → Override button + appropriate banner
3. Suggester + Any other checkout → No override button
4. Viewer + Any checkout → No buttons, appropriate banner

### Self-Checkout Testing  
1. User checks out → Checked-in buttons appear, checkout button disappears
2. User cancels → Checked-in buttons disappear, checkout button reappears
3. Other users see appropriate "checked out" banners

### Vendor Workflow Testing
1. Editor sends to vendor → Vendor checkout state
2. All non-vendor users see "vendor be redlining" banner
3. Only editors see override button during vendor checkout

---

*Last Updated: [Current Date]*
*Version: 1.0*

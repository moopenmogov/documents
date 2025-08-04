# OpenGov Contract Redlining v2: Real-time Sync Requirements

## Project Overview

**Current State (v1):** Manual sync via "Save to the Web" and "Load Last Saved Version" buttons  
**Target State (v2):** Real-time bidirectional sync with check-in/check-out document locking

## Core Features

### 1. Document Check-in/Check-out System
- **Single editor access** - Only one client can edit at a time
- **Automatic state synchronization** - UI reflects current checkout state
- **Real-time notifications** - Both clients see checkout changes immediately

### 2. Server-Sent Events (SSE) 
- **Real-time communication** from API server to both clients
- **Event types:** `document-checked-out`, `document-checked-in`, `document-updated`
- **Connection management** with heartbeat and reconnection

### 3. Enhanced User Interface
- **Dynamic button states** based on checkout status
- **Clear status indicators** showing who has document checked out
- **Intuitive workflow** for collaborative editing

## Button Specifications

### Word Add-in Button States

#### When document is available (not checked out):
- `🔒 Check-out Document` (enabled)
- `🔄 Load Last Saved Version` (enabled)
- `🌐 Go to OpenGov.com` (enabled)

#### When document is checked out by Word:
- `💾 Save & Check-in` (enabled)
- `🌐 Go to OpenGov.com` (enabled)

#### When document is checked out by Web:
- `🔒 Check-out Document` (disabled)
- `🔄 Load Last Saved Version` (enabled)
- `🌐 Go to OpenGov.com` (enabled)
- **Status Banner:** "🔒 Document checked out by Web Viewer"

### Web Viewer Button States

#### When document is available (not checked out):
- `🔒 Check-out Document` (enabled)
- `🔄 Load Last Saved Version` (enabled)
- `📁 Open New File` (enabled)

#### When document is checked out by Web:
- `💾 Save & Check-in` (enabled)
- `📁 Open New File` (disabled)

#### When document is checked out by Word:
- `🔒 Check-out Document` (disabled)
- `🔄 Load Last Saved Version` (enabled)
- `📁 Open New File` (enabled)
- **Status Banner:** "🔒 Document checked out by Word"

## User Workflows

### Workflow 1: Check-out in Word
1. User clicks `🔒 Check-out Document` in Word add-in
2. Word add-in → API server: `POST /api/checkout { source: "word" }`
3. API server broadcasts SSE: `document-checked-out { by: "word" }`
4. Web viewer receives SSE, updates UI to read-only mode
5. User edits in Word, clicks `💾 Save & Check-in`
6. API server saves document, broadcasts `document-updated` and `document-checked-in`
7. Web viewer shows update notification with refresh option

### Workflow 2: Check-out in Web Viewer
1. User clicks `🔒 Check-out Document` in web viewer
2. Web viewer → API server: `POST /api/checkout { source: "web" }`
3. API server broadcasts SSE: `document-checked-out { by: "web" }`
4. Word add-in receives SSE, updates UI to limited mode
5. User edits in SuperDoc, clicks `💾 Save & Check-in`
6. API server saves document, broadcasts `document-updated` and `document-checked-in`
7. Word add-in shows update notification with refresh option

### Workflow 3: Load Last Saved Version
- Available in both clients when document is not checked out by them
- Refreshes current client with latest saved version from server
- Does not affect checkout state

## Technical Requirements

### API Server Enhancements

#### New Endpoints
```javascript
GET  /api/events              // SSE endpoint for real-time updates
POST /api/checkout            // Check out document for editing
POST /api/checkin             // Check in document (release lock)
GET  /api/checkout-status     // Get current checkout state
```

#### Checkout State Management
```javascript
checkoutState = {
    isCheckedOut: boolean,
    checkedOutBy: "word" | "web" | null,
    checkedOutAt: timestamp | null,
    checkedOutUser: string | null
}
```

#### SSE Events
```javascript
// Event types
"document-checked-out"  // { by: "word"|"web", at: timestamp }
"document-checked-in"   // { previouslyBy: "word"|"web", at: timestamp }
"document-updated"      // { updatedBy: "word"|"web", version: timestamp }
"heartbeat"             // { timestamp: timestamp }
```

### Client-Side Requirements

#### Word Add-in
- SSE connection to `/api/events`
- Dynamic button state management based on checkout status
- Status banners for locked states
- Integration with existing Office.js document APIs

#### Web Viewer
- SSE connection to `/api/events`
- SuperDoc editor enable/disable based on checkout state
- Status banners for locked states
- File picker integration (unaffected by checkout state)

## Behavior Specifications

### Check-out Rules
- Document can only be checked out by one client at a time
- Check-out is explicit via button click (not automatic on edit)
- Check-out state persists until explicit check-in or save

### Save & Check-in Rules
- Save operation automatically checks in document (releases lock)
- Document becomes available for checkout by either client
- Other client receives notification of update

### Conflict Prevention
- UI prevents conflicting actions based on real-time state
- No error modals needed - buttons reflect server state
- Clear visual indicators of document availability

### Connection Management
- SSE connections auto-reconnect on disconnect
- Heartbeat messages every 30 seconds
- Graceful fallback if SSE unavailable

## Success Criteria

### User Experience
- ✅ Clear understanding of who can edit when
- ✅ No lost work due to conflicting edits
- ✅ Smooth handoff between Word and web editing
- ✅ Real-time awareness of document state

### Technical Performance
- ✅ SSE events delivered within 1 second
- ✅ Checkout state consistently synchronized
- ✅ No race conditions in checkout operations
- ✅ Graceful handling of network interruptions

### Compatibility
- ✅ Works with existing v1 functionality
- ✅ Backward compatible with manual sync if SSE fails
- ✅ Maintains Office Generator foundation
- ✅ Preserves OpenGov branding and UX

## Implementation Phases

### Phase 1: Server-Side Foundation
- Add checkout state tracking to API server
- Implement SSE endpoint and event broadcasting
- Add checkout/checkin API endpoints

### Phase 2: Client Integration  
- Add SSE listeners to Word add-in and web viewer
- Implement dynamic button state management
- Add status banners and notifications

### Phase 3: Testing & Polish
- Test all user workflows end-to-end
- Handle edge cases and error conditions
- Performance optimization and monitoring

---

**Current Branch:** `real-time-sync`  
**Target:** Replace manual sync with real-time collaborative editing  
**Foundation:** Built on stable v1 with Office Generator, OpenGov branding, and working sync
## Release: Approvals groundwork, State Matrix alignment, and Onboarding UX

Date: 2025-08-11
Branch: `feature/permissions-system`

### Highlights
- Approvals UI and logic groundwork across Web viewer and Word add-in
  - Inline users/approvals table with Approve/Reject actions
  - Per-user approval enablement based on role (viewer/suggester/editor)
  - Live refresh via SSE on approvals updates and user switch
- Centralized State Matrix powering visibility/enablement for buttons and banners
  - Shared client script `state-matrix-client.js` controls UI in both platforms
  - `View Latest` always present; disabled when no document is loaded
  - Document dropdown only shown when it has relevant nested actions
- Unified pink-themed button styling (including dropdown items)
- Onboarding UX
  - `start.bat` launches API, web viewer, and add-in; kills stale ports/processes
  - Welcome modal now loads strings from `scripts/welcome-strings.json`
- Backend improvements
  - `/api/approval-matrix` endpoint returns users, approvals, and the per-user action matrix
  - Hardened `/api/document/:id/approvals` with validation and clear error logs
  - Viewers cannot checkout; consistent users across platforms

### Breaking Changes
- None intended. If you see missing buttons, verify the state matrix config and current role.

### How to Run
1) Close Word. 2) Run `start.bat`. 3) Choose Proceed in the welcome modal. 4) Use the user switcher to exercise role-based states.

### Known Issues
- Word taskpane uses Office.js; blocking confirms are not supported. Editor overrides show non-blocking notifications instead.
- If approvals UI seems stale after a crash, ensure API is running and SSE connection is established (refresh once).

### Notable Files
- `api-server.js`: approvals endpoints, state matrix server config, SSE
- `viewer.html`: web UI, approvals grid, SSE listeners
- `src/taskpane/taskpane.html`: add-in UI, approvals grid, SSE listeners
- `state-matrix-client.js`: shared client logic for UI states
- `start.bat`, `scripts/welcome-modal.ps1`, `scripts/welcome-strings.json`: onboarding UX



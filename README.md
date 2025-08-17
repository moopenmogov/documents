# Contract Document System (Web + Word Add-in)

This repository contains a web viewer and a Microsoft Word add‑in for a contract redlining workflow. It includes real‑time approvals, finalize/draft states, notifications, and a lightweight chat assistant.

## Quick start

Prerequisites:
- Node.js 18+
- Word (desktop) if you plan to run the add‑in

Install deps and start the API + web app:

```bash
npm install
node api-server.js
```

Open the web viewer:
- Navigate to `http://localhost:3001/viewer.html`

Start the Word add‑in (basic steps):
- Open the Word add‑in taskpane HTML `src/taskpane/taskpane.html` via your preferred sideloading method (Office Add‑ins dev flow). The add‑in talks to the same local API at `http://localhost:3001`.

## Key features

- Approvals (web + add‑in)
  - Per‑user approve/reject, order, and notes
  - Live pill and table kept in sync across web and add‑in
  - Stable docId pinning in the web to avoid racey 0/5 states

- Finalize / Move to Draft (web + add‑in)
  - Web: available via “Document actions” dropdown
  - Add‑in: available in the matrix‑driven dropdown (Finalize when self‑checked‑out editor; Move to Draft when finalized)
  - SSE event `document-finalize-updated` keeps the add‑in’s banner and dropdown up‑to‑date when changes happen on the web

- Notifications
  - Small bell next to the current user in the web
  - Notifications are rendered in a modal; unread badge increments when modal closed
  - Transported to the add‑in via SSE (and shown in its taskpane list)

- Chat assistant (web)
  - Simple, fixed‑reply chat UI to prototype a future ChatGPT integration
  - Compact panel with pre‑seeded greeting and typing indicator

## Architecture overview

- `api-server.js` — Node API for approvals, finalize, SSE, and document endpoints
- `viewer.html` — web UI (approvals modal, notifications bell + modal, chat)
- `src/taskpane/taskpane.html` — Word add‑in UI (state matrix‑driven dropdown, SSE, approvals)
- `shared/approvals-client.js` — client wrapper for approvals endpoints

## Development notes

### Running the server
- Start with `node api-server.js` (listens on `http://localhost:3001`)
- SSE events drive live UI updates in both web and add‑in

### Web viewer tips
- Approvals are now “pinned” to a single document id per session. This prevents mixed document lookups and eliminates 0/5 reverts after confirm.
- If there is no real document id yet, reads are skipped until one is resolved.

### Word add‑in tips
- The dropdown is built from the server’s state matrix. For “Finalize” to appear:
  - User must be an editor
  - The add‑in must have the document self‑checked‑out (per server rules)
- Finalize/Move to Draft actions call the server and then refresh the matrix/banners.

## API reference (local)

- GET `/api/current-document` → `{ id, filename, filePath, lastUpdated }`
- GET `/api/state-matrix?userRole&platform&userId&isCheckedOut&checkedOutBy` → `{ success, config }`
- GET `/api/approvals/state?documentId` → approvals snapshot
- GET `/api/approval-matrix?actorPlatform&actorId&documentId` → UI flags/strings/users
- POST `/api/approvals/approve|reject|add-user|reorder|update-notes`
- POST `/api/finalize` | `/api/unfinalize` (editor‑only; finalize requires self‑checkout)

## Troubleshooting

- Web approvals show 0/5 intermittently:
  - Ensure the web server is running on `:3001` and the web viewer loaded the latest `viewer.html`.
  - The build pins the docId early and rewrites approvals calls; a hard reload (Ctrl+F5) may be needed after changes.

- Finalize doesn’t appear in the add‑in dropdown:
  - Confirm you’re an editor and the add‑in has the document self‑checked‑out.
  - Check DevTools console for “WORD finalize flags” and “buttons” to verify server signals.

## Branches

- `main` — stable branch
- `notification-bell` — recent work: notifications bell + chat, approvals docId pinning, add‑in finalize wiring

## License

AGPLv3 (matches SuperDoc license used in this project).



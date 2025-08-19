## Product vision: Next Generation Contract Authoring and Prototype 


This README is a collaboration between AI and Moti: the AI is the primary author; Moti is the editor. For materials authored purely by Moti, see the `READmeHUMAN` folder (minus the install-automation-eli5).

### What’s inside (overview)
- **Summary**: what the product does and why it exists
- **Development timeline**: a brief history based on GitHub activity
- **Technical architecture**: HTML-first clients (no React), shared logic between web and add‑in, backend, and how we integrate SuperDoc
- **Installation**: friendly guide for non‑technical readers
- **Lessons learned**: five takeaways from the build

---

## Summary

This is a working prototype of a contract authoring system with bidirectional sync between the web viewer and the Word add‑in. It supports end‑to‑end redlining workflows (check‑out/check‑in, finalize/unfinalize), approvals, templates, compile, notifications, and a vendor handoff. 

### Key capabilities
- **Bidirectional sync**: file alignment in a Word-native environment syncs with a web experience
- **Check-in and Check-out system**: role‑ and state‑aware actions with server validation and SSE refresh
- **Shared logic**: a single state matrix client configures both UIs for parity
- **Approvals**: per‑user approve/reject, ordering, and notes; live status indicators
- **Notifications**: a lightweight bell + modal in the web, with events mirrored to the add‑in
- **Compile**: generate a contract packet by compiling with exhibits
- **Templates**: view existing templates and check-out / modify them

---

## Release process

### Release phase definition

| Phase           | Description                                                                          | Access                           | Optional | Timing   |
|-----------------|--------------------------------------------------------------------------------------|----------------------------------|----------|----------|
| Prototype       | This gnarly thing, styled to OpenGov’s standard, aligned to the feature set          | Phased; internal, then external  | Yes      | ASAP     |
| Private Preview | Unlocks redlining and customer value (+GTM)                                          | Phased; internal, then external  | Yes      | End of Year |
| MVP             | Complete redlining experience with some traditional OG                               | All opt‑in                       | Yes      | 2026     |
| Transition      | Fully independent contract document experience                                       | All                              | No       | 2026     |

### Release plan

| Name                     | Prototype | Private Preview | MVP | Transition |
|--------------------------|-----------|-----------------|-----|------------|
| Core infra** – add‑in    | No        | Yes             | Yes | Yes        |
| Core infra** – web‑page  | No        | Yes             | Yes | Yes        |
| Okta + user management   | No        | Yes             | Yes | Yes        |
| Website integration      | No        | Yes             | Yes | Yes        |
| File management          | No        | Yes             | Yes | Yes        |
| Basic AI integration     | No        | Yes             | Yes | Yes        |
| Check‑in / check‑out     | Yes       | Yes             | Yes | Yes        |
| Email automation         | No        | No              | Yes | Yes        |
| Variables                | No        | No              | Yes | Yes        |
| Signatures               | No        | No              | Yes | Yes        |
| Lock sections            | No        | No              | Yes | Yes        |
| Vendor experience        | No        | No              | Yes | Yes        |
| Compile                  | Yes       | No              | No  | Yes        |
| Approvals                | Yes       | No              | No  | Yes        |
| Templates                | Yes       | No              | No  | Yes        |

---

## Technical architecture (high‑level)

### Clients: HTML‑first, no React
- We intentionally use plain HTML/JS to keep UX flexible and easily embeddable (especially in Office add‑ins), reduce tooling overhead, and speed up iteration.

### Web viewer and Word add‑in
- A significant portion of behavior is shared via the state matrix (visibility, order, and labels for actions). Roughly 50–60% of interaction logic is shared, with platform‑specific rendering kept thin.
- Shared dropdown builder and state application live in `state-matrix-client.js`.

### Backend
- `api-server.js` provides approvals, finalize/unfinalize, compile health checks, document upload/replace, and SSE event streams.
- The server enforces business rules (e.g., finalize requires self‑checkout by an editor) and pushes updates via SSE to keep UIs in sync.

### SuperDoc integration
- The project includes SuperDoc for rich‑text editing foundations and examples; our viewer and add‑in integrate around document transport and workflow instead of bundling a full editor here.

---

## Installation (friendly guide)

You don’t need to be a developer to try this locally.

### 1) Prerequisites
- Node.js 18+ (verify with `node -v`)
- Git (optional but recommended)
- Microsoft Word (desktop) if you want to try the add‑in

### 2) Install and start the server
```bash
npm install
node api-server.js
```
By default the API listens on `http://localhost:3001`.

### 3) Open the web viewer
- Visit `http://localhost:3001/viewer.html`
- Switch user (top left), use the “Document actions” dropdown, and try approvals and notifications

### 4) Open the Word add‑in (optional)
The add‑in is pure HTML/JS for demo. The quickest way to sideload:
- Enable Word to trust local files (Office add‑in dev setting, if needed)
- Open the file `src/taskpane/taskpane.html` directly in Word via your dev sideload method (see Office Add‑ins docs)
- The add‑in will talk to the same `http://localhost:3001` API

Tips for add‑in:
- If “Finalize” doesn’t appear, check out the document first as an editor
- If a modal doesn’t appear, ensure the server is running and hard‑reload the taskpane

### 5) Troubleshooting
- Port is busy: change the port in `api-server.js` (PORT) and update references if needed
- CORS/Network: this prototype serves everything from the same origin; reload if you change server code
- Word autoplay: videos auto‑play muted due to host policies; unmute in the player

---

## Lessons learned (top 5)

- **Centralize state**: a shared state matrix eliminates duplicated conditionals and keeps platforms in lock‑step.
- **Prefer SSE for parity**: events drive consistent banners and dropdowns across clients.
- **Office constraints matter**: avoid `window.confirm` in add‑ins; use a consistent in‑app modal.
- **Pin identities early**: pinning document ids prevents cross‑document approval glitches.
- **Keep platforms thin**: renderers should stay small; shared logic does the heavy lifting.

---

## API reference (local)

- GET `/api/current-document` → `{ id, filename, filePath, lastUpdated }`
- GET `/api/state-matrix?userRole&platform&userId&isCheckedOut&checkedOutBy` → `{ success, config }`
- GET `/api/approvals/state?documentId` → approvals snapshot
- GET `/api/approval-matrix?actorPlatform&actorId&documentId` → UI flags/strings/users
- POST `/api/approvals/approve|reject|add-user|reorder|update-notes`
- POST `/api/finalize` | `/api/unfinalize` (editor‑only; finalize requires self‑checkout)

---

## Branches

- **main**: stable
- See feature branches in Git history for milestones (notifications, approvals pinning, add‑in parity).

---

## Developer: backend install scripts and smoke test

For backend‑only testing (no MSI yet), use the PowerShell scripts under `scripts/`.

- Per‑user auto‑start (Scheduled Task):
  - Run: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/install-per-user-task.ps1 -Port 3001`
  - On next logon the server starts automatically. To start now in the current console: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-server.ps1 -Port 3001`

- Smoke test:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke-test.ps1 -Port 3001`
  - Prints PASS/FAIL for `/api/health`, `/api/version`, and `/api/troubleshoot`. If failing, open `/api/troubleshoot` and email contents to `msorkin@opengov.com`.

- Uninstall per‑user task:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/uninstall-per-user-task.ps1`

- Repair (non‑destructive re‑seed if missing):
  - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/repair.ps1 -Port 3001`

- Update in place (backend‑only):
  - Stop, backup binaries, copy new build, preserve `.env`/data, restart.
  - Dry‑run: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-in-place.ps1 -SourceDir C:\path\to\new -DryRun`
  - Apply: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-in-place.ps1 -SourceDir C:\path\to\new`

Notes:
- These scripts are for developer iteration. The end‑user path will be a signed MSI/EXE installer as described in `READmeHUMAN/specs/install-automation-eli5.md`.
- If Node is not in PATH, `start-server.ps1` will error (for dev). The MSI will bundle the server.

---

## License

AGPLv3 (matches SuperDoc license used in this project).

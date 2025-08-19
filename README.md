## Product vision: Next Generation Contract Authoring and Prototype (now with 100% more dad jokes) 


This README is a collaboration between AI and Moti: the AI types fast and tells questionable jokes; Moti edits and keeps the ship pointed at land. For materials authored purely by Moti, see the `READmeHUMAN` folder (minus the install-automation-eli5). 

### What’s inside (overview)
- **Summary**: what the product does and why it exists
- **Development timeline**: a brief history based on GitHub activity
- **Technical architecture**: HTML-first clients, shared logic between web and add‑in, backend, and how we integrate SuperDoc
- **Installation**: friendly guide for non‑technical readers
- **Lessons learned**: five takeaways from the build

---

## Summary

This is a working prototype of a contract authoring system with bidirectional sync between the web viewer and the Word add‑in. It supports end‑to‑end redlining workflows (check‑out/check‑in, finalize/unfinalize), approvals, templates, compile, notifications, and a vendor handoff. It does everything except make coffee; that’s in the 2031 roadmap. And of course, beware the fake doors and easter eggs.

### Key capabilities (the greatest hits tour)
- **Bidirectional sync**: file alignment in a Word-native environment syncs with a web experience
- **Check-in and Check-out system**: role‑ and state‑aware actions with server validation and SSE refresh
- **Shared logic**: a single state matrix client configures both UIs for parity
- **Approvals**: per‑user approve/reject, ordering, and notes; live status indicators
- **Notifications**: a lightweight bell + modal in the web, with events mirrored to the add‑in
- **Compile**: generate a contract packet by compiling with exhibits
- **Templates**: view existing templates and check-out / modify them
 - **Dad‑mode**: if something fails, we give you a friendly message instead of a cryptic stack trace. (We still keep the trace—behind the fridge.)

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
## Working with the Word add‑in

### The 60‑second primer (what an Office taskpane add‑in is)
- A taskpane add‑in is just a web app (HTML/JS/CSS) hosted in an Edge WebView inside Word.
- Word loads your add‑in via a manifest (XML) that points to your pages (HTTPS or trusted local HTTP for dev).
- You talk to the document via Office JS APIs (e.g., `Word.run(...)`). Everything else is standard web.

### Creating one (the basics)
- Scaffold: use the OfficeDev templates (this repo originated from one) or any web stack.
- Entry points:
  - `manifest.xml` → Word reads this to find `taskpane.html` and command surfaces.
  - `src/taskpane/taskpane.html` → the UI; includes our shared scripts.
  - `webpack.config.js` → bundles and serves the dev build on `https://localhost:3000/`.
- Dev loop options:
  - `npm start` launches the dev server and sideloads into Word (accept the cert prompt on first run).
  - Or use our single‑click flow and then manually open the add‑in from Insert → My Add‑ins → Shared Folder.

### Publishing to the Partner Center (super short version)
- Build a production site (HTTPS) and set those URLs in the manifest.
- Prepare store metadata (name, descriptions, screenshots, privacy/security answers).
- Validate with the Office Add‑in validator.
- Submit in Partner Center and track certification.
- Ownership: this is normally PM territory — Moti, your PM should take this and run with it. We’ll support with the manifest and technical Q&A.

### How this add‑in is built in this repo (and why it’s reusable)
- HTML‑first UI: `src/taskpane/taskpane.html` (no framework lock‑in; loads fast in Office WebView).
- Shared logic used by both web and add‑in:
  - `state-matrix-client.js` drives labels, visibility, and ordering of actions.
  - `new-feature-banner.js` + `update-check.js` for the banner and update notices.
  - API contracts from `api-server.js` (same endpoints for both clients).
- Build/dev:
  - `webpack.config.js` serves the dev add‑in on `https://localhost:3000/` and copies canonical JSON from the repo root.
  - Our single‑click `Click--Me--To--Install--...bat` starts the API on `http://localhost:3001`, registers a local Trusted Catalog, and opens the web viewer.

### Reuse with the web experience (the big win)
- UI parity comes from shared scripts, not duplicated logic. The dropdown, finalize/unfinalize modal, approvals state, and banner/update code are the same files.
- If you improve the web UI logic in a shared file, the add‑in benefits with zero extra work.
- Conversely, add‑in‑only constraints (e.g., no `window.confirm`) are wrapped once in shared helpers and used by both.

Tips:
- Prefer adding features in shared files first; then keep platform‑specific glue minimal.
- Keep endpoints identical for web and add‑in; version them behind `/api/*` and feature‑flag in one place.

---

## Installation (friendly guide with friendly vibes who's friendly and perfect and awesome and amazing)

You don’t need to be a developer to try this locally.

### 1) Prerequisites
- Node.js 18+ (verify with `node -v`)
- Git (optional but recommended)
- Microsoft Word (desktop) if you want to try the add‑in

### 2) Single‑click start (end user)
- Double-click `Click--Me--To--Install--The--Application--On--My--Computer--Please.bat`
- What it does:
  - Installs a portable Node runtime if missing
  - Starts the backend API and serves the web UI from the same origin
  - Registers a Word add-in via a Trusted Catalog (user-level)
  - Opens the web viewer
- Where it runs:
  - API and web UI: `http://localhost:3001`

### 3) Open the web viewer
- Visit `http://localhost:3001/viewer.html`

### 3) Open the web viewer (ta‑da!)
- Visit `http://localhost:3001/viewer.html`
- Switch user (top left), use the “Document actions” dropdown, and try approvals and notifications

### 4) Open the Word add‑in (one‑time user action)
- In Word, go to: Insert → My Add‑ins → Shared Folder → select “OpenGov Contracting”.
- If you don’t see it, click Refresh. If it’s playing hide‑and‑seek, close and reopen Word once so it remembers where we put things.

Tips for add‑in:
- If “Finalize” doesn’t appear, check out the document first as an editor
- If a modal doesn’t appear, ensure the server is running and hard‑reload the taskpane

### 5) Troubleshooting (turn it off and on again, but with style)
- **Port is busy**: something else parked on 3001. Change `PORT` in `api-server.js` (we recommend 3007, because 7 is lucky) and retry.
- **CORS/Network**: we serve everything from the same origin—refresh and you should be golden.
- **Word autoplay**: videos autoplay muted (it’s a policy thing). Tap the mute icon and pretend it was your idea.
- **Diagnostics**: open `http://localhost:3001/api/troubleshoot`, copy the text, and send it to Moti. We read logs so you don’t have to.

---

## Lessons learned (top 5, no spoilers)

- **Centralize state**: a shared state matrix eliminates duplicated conditionals and keeps platforms in lock‑step.
- **Prefer SSE for parity**: events drive consistent banners and dropdowns across clients. WebSockets are cool too—we’re just into minimalism.
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

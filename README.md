## Product vision: Next Generation Contract Authoring

This README is a collaboration between AI and Moti: the AI is the primary author; Moti is the editor. For materials authored purely by Moti, see the `READmeHUMAN` folder.

### What’s inside (overview)
- **Summary**: what the product does and why it exists
- **Development timeline**: a brief history based on GitHub activity
- **Technical architecture**: HTML-first clients (no React), shared logic between web and add‑in, backend, and how we integrate SuperDoc
- **Installation**: friendly guide for non‑technical readers
- **Lessons learned**: five takeaways from the build

![Clippy](https://upload.wikimedia.org/wikipedia/en/5/5f/Clippy-letter.png)

---

## Summary

This system delivers a streamlined contract redlining workflow across a web viewer and a Microsoft Word add‑in. It supports approvals, finalize/draft state toggles, notifications, and a matrix‑driven “Document actions” dropdown that keeps UX consistent in both clients.

### Key capabilities
- **Approvals**: per‑user approve/reject, ordering, and notes; live status indicators
- **Finalize / Move to Draft**: role‑ and state‑aware actions with server validation and SSE refresh
- **Notifications**: a lightweight bell + modal in the web, with events mirrored to the add‑in
- **Shared logic**: a single state matrix client configures both UIs for parity

---

## Development timeline (high‑level)

- Early prototypes established real‑time flows and editor/role semantics.
- Centralization phase moved visibility/labels/order into a shared state matrix client.
- Parity phase aligned web and add‑in dropdowns, banners, and approvals behaviors.
- Recent work focused on reliability: SSE updates, document id pinning, and finalize/unfinalize UX.

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

1) Install prerequisites
- Install Node.js 18+.
- If you want the Word add‑in, ensure you have desktop Word.

2) Start the local server
```bash
npm install
node api-server.js
```

3) Open the web viewer
- Visit `http://localhost:3001/viewer.html` in your browser.

4) Open the Word add‑in (optional)
- Sideload `src/taskpane/taskpane.html` via the Office Add‑ins developer flow. The add‑in uses the same `http://localhost:3001` API.

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

## License

AGPLv3 (matches SuperDoc license used in this project).

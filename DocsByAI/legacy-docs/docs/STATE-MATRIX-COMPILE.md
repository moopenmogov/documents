# State Matrix: Compile and Replace Default

This document scopes how the state matrix governs visibility/enablement for Compile and Replace Default across Web and Word, and which validations remain server-side.

## Buttons and IDs

- Buttons in matrix config:
  - `compileBtn`: show the Compile action (label: "Compile")
  - `replaceDefaultBtn`: show Replace default document
  - `viewOnlyBtn`: show View Latest

Both platforms use the same IDs; the shared client applies the matrix.

## Visibility rules (server matrix today)

- `compileBtn`: true for all roles.
- `replaceDefaultBtn`: true for all roles (prototype; may restrict later by role).
- `viewOnlyBtn`: true if there is any current/default document; still shown when missing to guide users.

Note: Current implementation exposes these as visibility; enablement is validated server-side on action.

## Enablement and validations (server on action)

- Replace Default (upload DOCX)
  - Accept only `.docx` → else 400 `unsupported_media_type` with an instructional message.
  - Atomic write to `default-document/current.docx` (temp + rename). No history retained.
  - Reject empty/invalid DOCX (e.g., <1KB or not starting with PK header).
  - Preserve original filename in responses (Content-Disposition).

- Compile
  - Primary: generated from the current default DOCX (DOCX → PDF) when using `primary.type = 'current'`. Fallback `pdfBase64` accepted.
  - Exhibits: by ID via `exhibitsById: [{ id, include, order }]` (server resolves IDs to paths) or by path during transition.
  - Order: primary first, then first exhibit, then second exhibit.
  - Limits: ≤ 2 included exhibits → else 400 `too_many_exhibits` with `{ max: 2, message }`.
  - Missing primary: 400 `default_document_missing` with actionable resolution.
  - Missing exhibits: `exhibit_not_found` or `exhibits_missing` with list of missing IDs/paths.
  - No selected inputs: 400 `no_inputs_selected` when neither primary nor any exhibit is included.

## Optional future matrix extensions (if UI needs pre-checks)

- Add `config.compile` object to matrix payload:
  - `enabled`: boolean (e.g., false when no default document is present)
  - `reasonKey`/`message`: explain disablement in UI
  - `limits`: `{ maxExhibits: 2 }` for client-side guardrails

Until then, clients show buttons via matrix and rely on server messages for errors.

## Storage

- Default DOCX: `default-document/current.docx` (single source of truth).
- Exhibits: `exhibits/` (served at `/exhibits`).

## UX copy (client)

- Adding a 3rd exhibit: “Testing 1, 2...but no more in the prototype”.
- Default missing on compile: “No default document found. Use ‘Replace default document’ to upload a .docx, then try again.”
- Add-in autoplay: Rickroll modal auto-plays muted due to browser policies; users can unmute in the player.

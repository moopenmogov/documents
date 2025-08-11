## Approver Logic State Matrix

This matrix defines approval UI/permission rules. It is independent of document checkout state.

Key points:
- Approver state does not depend on checkout.
- A user can always approve themself unless already approved.
- A user can always reject themself unless already rejected.
- Viewers get no approval buttons at all.
- Users can only act for themself.
- Editors are the only role that can approve/reject on behalf of others.

Columns represent the target of the action (self vs others) and the target's current approval status.
Each cell lists which buttons are shown and whether they are enabled.

Legend:
- “Approve(disabled)” means the Approve button is visible but disabled.
- “—” means no buttons are shown.

| Role → / Target-Status ↓ | Self: Approved | Self: Unapproved | Others: Approved | Others: Unapproved |
|---|---|---|---|---|
| Viewer | — | — | — | — |
| Suggester | Reject(enabled) | Approve(enabled) | — | — |
| Vendor | Reject(enabled) | Approve(enabled) | — | — |
| Editor | Reject(enabled) | Approve(enabled) | Reject(enabled) | Approve(enabled) |

Disabled states (implicit):
- If the relevant button would otherwise be shown but the target is already in that state, the button is disabled instead of enabled.
  - Example: Self already Approved → Approve(disabled); Self already Unapproved → Reject(disabled).

Notes:
- Viewers never see approval controls.
- For non-editors, acting on others is not permitted, so no buttons are shown in the “Others” columns.

### Backend API (shared by Web and Word add-in)

Endpoint:
```
GET /api/approval-matrix?actorPlatform=web|word&actorId=<USER_ID>&documentId=<DOC_ID>
```

Response shape:
```
{
  success: true,
  users: [ { id, name, role, ... }, ... ],
  matrix: {
    [userId]: {
      userId: string,
      status: 'approved' | 'unapproved',
      showButtons: boolean,
      approveEnabled: boolean,
      rejectEnabled: boolean
    },
    ...
  },
  approvals: [ { userId, status, approvedBy, approvedAt }, ... ],
  summary: { approvedCount: number, totalUsers: number },
  actor: { id: string, role: 'viewer' | 'suggester' | 'vendor' | 'editor' }
}
```

Rules embodied in API:
- Viewers: `showButtons = false` for all targets.
- Non-editors on others: `showButtons = false`.
- Editors on others: `showButtons = true` with enablement based on target status.
- Self: always `showButtons = true` (non-viewers), with enablement based on self status.

Example cURL:
```
curl "http://localhost:3001/api/approval-matrix?actorPlatform=web&actorId=user1&documentId=default-doc"
```

### UI Guidance
- Web viewer and Word add-in should render the Approve/Reject buttons based on `matrix[targetUserId]`:
  - If `showButtons` is false: render “No actions”.
  - Else render both buttons with `disabled` bound to `!approveEnabled` / `!rejectEnabled`.
- Re-fetch this matrix on SSE `approvals-updated` and on user-switch events.




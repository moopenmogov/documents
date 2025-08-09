# Approvals Feature Plan (Source Plan from PM)

UI changes to make room:
1. Mirror the add-in design as much as possible. Move all the interaction methods to the right side.
2. Title across the center in the same way as the current yellow banner behind the users.
3. Consolidate all the document related buttons into a single drop-down menu similar to the user dropdown. E.g., check-out document, etc. but have "Open" be its own button.
4. Recreate the user views:
   - 4a: Create a single button that says Users, and have it open a modal.
   - 4b: In the modal display the user list.
   - 4c: In the user list show one column for the user permissions and the approval status.
   - 4d: Approval status can be Unapproved or Approved.
   - 4e: Approval can be changed via a button — approve or unapprove whenever you want.
   - 4f: [combine — (unspecified note in source text)]

Non-UI / backend:
1. Align the users across platforms. It should be the same 4 users on both platforms. Pick the users from the web viewer.
2. Approval rules:
   - 2a: Users can only approve for themselves.
   - 2b: Editors are exceptions to 2a and can approve or unapprove anyone.
   - 2c: Add an affordance around non-editor users — to editors — to indicate they can approve those people too.
   - 2d: When an editor approves or unapproves on behalf of someone else, give a confirmation modal for the editor.
3. Ensure all approval actions are logged in the notification area.

# Feedback Role Implementation Plan

## Overview
Implement a "feedback" user role that can view documents, add comments, and make edits **only with tracked changes enabled**. This ensures all modifications are visible and attributable.

## Technical Approach: SuperDoc-Based Solution
Instead of fighting Office.js limitations for tracked changes enforcement, leverage SuperDoc's built-in role-to-mode mapping system.

### SuperDoc Capabilities
- **Document Modes**: `editing`, `viewing`, `suggesting` (track changes mode)
- **User Roles**: `editor`, `viewer`, `suggester` 
- **Automatic Enforcement**: User role restricts available document modes
- **Key Insight**: SuperDoc automatically enforces correct mode based on user role

### Role Mapping Strategy
- `feedback` user role → SuperDoc `suggesting` mode
- `editor` user role → SuperDoc `editing` mode  
- `viewer` user role → SuperDoc `viewing` mode

## Implementation Plan

### Phase 1: SuperDoc Mode Integration
**Goal:** Integrate role-based SuperDoc mode enforcement

#### Step 1: Add Role-to-Mode Mapping Function
- Create `getSuperdocMode(userRole)` function
- Map `feedback` → `suggesting`, `editor` → `editing`, `viewer` → `viewing`
- **Test**: Verify correct mode returned for each role

#### Step 2: Update SuperDoc Initialization  
- Pass role-based `documentMode` to SuperDoc constructor
- Replace static mode logic with dynamic role-based logic
- **Test**: Load document with different roles, verify correct SuperDoc mode

#### Step 3: Validate SuperDoc Mode Enforcement
- **CRITICAL RISK VALIDATION**: Test if SuperDoc actually enforces modes
- Test `suggesting` mode prevents direct edits, shows changes as suggestions
- Test `viewing` mode blocks all editing
- **Test**: Manual mode switching and edit attempts

### Phase 2: Cross-Platform Consistency
**Goal:** Ensure consistent behavior across Word add-in and web viewer

#### Step 4: Add "Feedback" Role to User System
- Add feedback users to API server user definitions
- Update UI role switching functionality
- **Test**: Role switching, UI updates

#### Step 5: Word Add-in Integration
- For Word: Use Office.js tracked changes for feedback users
- For Web: Use SuperDoc suggesting mode
- Hybrid approach for platform-specific capabilities
- **Test**: Cross-platform behavior verification

### Phase 3: Advanced Features

#### Step 6: Role-Based Button Visibility
- Update UI to show appropriate actions per role
- Hide/show buttons based on user permissions
- **Test**: UI consistency across roles

#### Step 7: Real-time Role Switching
- Dynamic SuperDoc mode updates when user role changes
- Seamless transitions without document reload
- **Test**: Live role switching

## Risk Mitigation

### Major Risks
1. **SuperDoc Mode Enforcement**: SuperDoc might not actually prevent editing
   - **Mitigation**: Test thoroughly in Step 3, fallback to UI-only restrictions
2. **Cross-Platform Inconsistency**: Word vs Web behavior differs
   - **Mitigation**: Document differences, provide clear user guidance
3. **SuperDoc API Limitations**: Mode switching APIs might not exist
   - **Mitigation**: Check documentation, contact SuperDoc support
4. **User Experience Confusion**: Users don't understand mode differences
   - **Mitigation**: Clear UI indicators, help text, training materials

### Testing Strategy
- **Unit Tests**: Each function works in isolation
- **Integration Tests**: Works with existing system
- **User Tests**: Role switching and behavior verification
- **Cross-Platform Tests**: Word + Web consistency

## Success Criteria
- ✅ Feedback users can only suggest changes (no direct edits)
- ✅ Suggestions are clearly marked and attributable
- ✅ Role switching works seamlessly
- ✅ Consistent behavior across Word add-in and web viewer
- ✅ Existing functionality remains unaffected

## Implementation Status
- [x] Plan documented
- [ ] Step 1: Role-to-mode mapping function
- [ ] Step 2: SuperDoc initialization update
- [ ] Step 3: Mode enforcement validation
- [ ] Step 4: Feedback role addition
- [ ] Step 5: Cross-platform integration
- [ ] Step 6: UI updates
- [ ] Step 7: Real-time switching

---
*Last Updated: 2025-08-06*
*Branch: feature/feedback-role-tracked-changes*
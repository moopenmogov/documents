# OpenGov Contract Docs - Collaborative Workflow Project Plan

## 🎯 Project Vision
Build a comprehensive document collaboration workflow that enables secure, permission-based editing and commenting across multiple stakeholders (agency staff, colleagues, vendors) with real-time change tracking and automated document organization.

## 📋 Core Workflow Requirements

### 1. Document Lifecycle Workflow
```
Create/Upload → Internal Edits → Colleague Review → Vendor Comments → Agency Final Review → Word Integration
```

**Detailed Flow:**
1. **Document Creation/Upload** - Start with new doc or upload existing
2. **Internal Changes** - Agency staff makes initial edits
3. **Colleague Collaboration** - Send to colleague for full editing rights
4. **Vendor Review** - Send to vendor with comment-only permissions
5. **Vendor Feedback** - Vendor adds comments, cannot edit content
6. **Agency Final Review** - Agency reviews all comments and changes
7. **Word Integration** - All changes/comments sync back to Word document
8. **Real-time Resolution** - Resolve comments and tracked changes in real-time

### 2. Permission System (Browser-Based, Simple)
**User Roles:**
- **Agency Admin** - Full edit, comment, permission management
- **Agency Staff** - Full edit and comment
- **Colleague** - Full edit and comment (when invited)
- **Vendor** - Comment only, no content editing
- **Viewer** - Read-only access

**Permission Features:**
- Simple user management (no Okta/SSO integration)
- Document-level permissions
- Section-level restrictions
- Comment-level restrictions
- Browser-based authentication (session-based)

### 3. Email Integration (Simple)
**Requirements:**
- Generate shareable links (no complex email integration)
- Simple notification system
- Link-based document sharing
- Email templates for common workflows
- No SMTP/email server setup required

**Implementation:**
- Generate secure, time-limited sharing links
- Copy-paste email templates
- Manual email sending (copy email content + link)
- Link expiration and access tracking

### 4. Comments & Tracked Changes
**Real-time Features:**
- Live comment threads
- Tracked changes visualization
- Change acceptance/rejection
- Comment resolution workflow
- Version comparison
- Change attribution (who made what change)

**Display Requirements:**
- Total comment count
- Unresolved comment count
- Change summary dashboard
- Real-time sync between web and Word

### 5. Document Sections (Automated)
**Section Detection:**
- Automatic section creation based on font size threshold
- Toggle setting: "Create sections when font size ≥ X"
- Font size selector (12pt, 14pt, 16pt, 18pt, etc.)

**Section Controls:**
- Simple on/off toggle per section
- Section-based permissions
- Section-level commenting
- Section navigation
- Section status tracking

## 🏗️ Technical Architecture

### Frontend Components
1. **Document Viewer/Editor** (SuperDoc-based)
2. **Permission Management Panel**
3. **Comment System Interface**
4. **Section Management Controls**
5. **Workflow Status Dashboard**
6. **Sharing & Email Interface**

### Backend Components
1. **Document Storage & Versioning**
2. **User Session Management**
3. **Permission Engine**
4. **Comment & Change Tracking**
5. **Link Generation & Security**
6. **Section Detection Algorithm**

### Integration Points
1. **Word Add-in Sync**
2. **SuperDoc Integration**
3. **Real-time Updates (WebSockets)**
4. **File Upload/Download**

## 📊 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Core Infrastructure:**
- [ ] User session management (simple login)
- [ ] Document upload/storage system
- [ ] Basic permission framework
- [ ] Document versioning
- [ ] Simple sharing link generation

**Deliverable:** Basic multi-user document access with simple permissions

### Phase 2: Collaboration Features (Weeks 3-4)
**Commenting & Tracking:**
- [ ] Comment system integration with SuperDoc
- [ ] Tracked changes visualization
- [ ] Real-time comment updates
- [ ] Comment resolution workflow
- [ ] Change acceptance/rejection

**Deliverable:** Full commenting and change tracking system

### Phase 3: Workflow Management (Weeks 5-6)
**Process Control:**
- [ ] Document workflow states
- [ ] Permission-based editing restrictions
- [ ] Vendor comment-only mode
- [ ] Workflow status dashboard
- [ ] Email template system

**Deliverable:** Complete workflow from creation to final review

### Phase 4: Advanced Features (Weeks 7-8)
**Automation & Organization:**
- [ ] Font-size based section detection
- [ ] Section on/off controls
- [ ] Section-level permissions
- [ ] Advanced sharing options
- [ ] Analytics and reporting

**Deliverable:** Automated section management and advanced controls

## 🎯 Success Metrics

### User Experience Metrics
- Time from document creation to final approval
- Number of comments resolved per session
- User adoption across different roles
- Workflow completion rate

### Technical Metrics
- Real-time sync reliability (Word ↔ Web)
- Comment/change persistence
- Permission enforcement accuracy
- System performance with concurrent users

## 🔧 Technical Decisions

### Authentication Strategy
**Simple Session-Based:**
- No external identity providers
- Browser session storage
- Simple user registration/login
- Document-based access tokens

### Email Integration Strategy
**Link-Based Sharing:**
- Generate secure, expiring links
- Provide email templates for manual sending
- Track link access and usage
- No complex SMTP integration

### Section Detection Algorithm
**Font-Size Based Logic:**
```javascript
// Configurable threshold
const sectionThreshold = 16; // pt

// Detect sections
function detectSections(document) {
  return document.paragraphs
    .filter(p => p.fontSize >= sectionThreshold)
    .map(p => createSection(p));
}
```

### Permission Model
**Document-Level + Section-Level:**
```javascript
const permissions = {
  document: { read: true, edit: true, comment: true },
  sections: {
    'section-1': { visible: true, restricted: false },
    'section-2': { visible: false, restricted: true }
  }
}
```

## 📋 Next Steps Proposal

### Immediate Actions (This Week)
1. **Create project structure** - Set up development branches and architecture
2. **Design permission model** - Define user roles and access patterns
3. **Plan comment integration** - Research SuperDoc comment APIs
4. **Prototype section detection** - Build font-size based section algorithm

### Week 1-2 Focus
1. **Build user management system** - Simple login/session handling
2. **Implement document upload** - Multi-format support with conversion
3. **Create permission framework** - Role-based access control
4. **Set up sharing links** - Secure, time-limited document access

### Technical Priorities
1. **Real-time infrastructure** - WebSocket setup for live updates
2. **Comment persistence** - Database design for comments/changes
3. **Word integration** - Bidirectional sync with permissions
4. **Security model** - Access control and data protection

## 💭 Strategic Questions for Validation

1. **User Workflow:** Does this match real government contract processes?
2. **Permission Complexity:** Is the simple permission model sufficient?
3. **Email Integration:** Will manual email with links meet user needs?
4. **Section Management:** What other section criteria beyond font size?
5. **Scalability:** How many concurrent users per document?
6. **Compliance:** Any specific government security requirements?

## 🚀 Ready to Begin?

**Recommended Starting Point:** 
Begin with Phase 1 (Foundation) focusing on user management and basic document sharing, then validate the workflow with a simple prototype before building advanced features.

**First Implementation Task:**
Set up the user session management system and basic permission framework to enable the multi-user workflow foundation.
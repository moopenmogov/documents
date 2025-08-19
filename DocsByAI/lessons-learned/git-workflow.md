# Git Workflow: Project Management Lessons

## Commit Message Strategy

### Evolution from Bad to Good

#### ❌ Vague Messages (Early Project)
```bash
git commit -m "fix things"
git commit -m "update files"  
git commit -m "working now"
git commit -m "stuff"
```

**Problem:** Impossible to understand what changed or find specific fixes.

#### ✅ Descriptive with Status Indicators
```bash
git commit -m "FINAL FOUNDATION: Clear button text + Open New File feature

✅ Button text clarified: Save/Open from/to 'the Web' and 'Word' 
✅ Web viewer: 'Open New File' button for direct .docx upload
✅ Three workflows: Word→Web, Web→Word, Direct→Web
✅ All sync functions tested and working
✅ Ready for SSE implementation"
```

**Benefits:**
- Clear scope in title
- Status indicators (✅ ❌ 🎯)
- Detailed what works
- Context for next steps

## Branch Strategy

### Failed Approach: Feature Creep
```bash
# Started simple
git checkout -b simple-sse-test

# But kept adding features
git commit -m "add sse"
git commit -m "add word integration"  
git commit -m "add superdoc"
git commit -m "add branding"
git commit -m "add registry fixes"
git commit -m "add office generator"

# Branch became unmergeable mess
```

### Successful Approach: Foundation + Features
```bash
# 1. Stable foundation first
git checkout -b feature/sse-real-time-sync
git commit -m "FOUNDATION: Working Office generator add-in"

# 2. Add one feature at a time with verification
git commit -m "BRANDING: Add OpenGov theme to Word add-in and web viewer"
git commit -m "FEATURES: Add simplified button text and Open New File"

# 3. Clean checkpoint before next feature
git commit -m "FINAL FOUNDATION: Complete working base for SSE"

# 4. Clean merge to main
git checkout main
git merge feature/sse-real-time-sync
```

## Project Structure Management

### The Nested Directory Problem
```bash
# How we ended up with chaos:
git status
# Document project/
# ├── api-server.js              # Old version
# ├── taskpane.html              # Old version
# ├── OpenGov-Contracts-Clean/
# │   └── OpenGov Contracting/   # New working version
# └── OpenGov Contracts/         # Another duplicate
```

**Problems:**
- Unclear which files are current
- Merge conflicts on duplicate names
- Confusion during development

### Solution: Clean Before Merge
```bash
# 1. Move working files to root
Copy-Item -Path "OpenGov-Contracts-Clean\OpenGov Contracting\*" -Destination . -Recurse -Force

# 2. Remove duplicates  
Remove-Item -Path "OpenGov-Contracts-Clean" -Recurse -Force
Remove-Item -Path "OpenGov Contracts" -Recurse -Force

# 3. Commit cleanup
git add .
git commit -m "CLEANUP: Move working project to root, remove nested directories"

# 4. Now merge cleanly
git checkout main
git merge feature/sse-real-time-sync
```

## Checkpoint Strategy

### Create Safety Nets
```bash
# Before risky changes, create explicit checkpoints
git add .
git commit -m "CHECKPOINT: Working sync before attempting SSE integration"

# Tag important milestones
git tag v1.0-foundation
git tag v1.1-branding-complete
```

### Recovery Commands
```bash
# If everything breaks, return to checkpoint
git log --oneline -10
# 9eb9116 FINAL FOUNDATION: Clear button text + Open New File feature
# 5466fe8 FOUNDATION: Working Office generator add-in

# Return to known good state
git checkout 9eb9116

# Or create new branch from checkpoint
git checkout -b recovery-branch 9eb9116
```

## Handling Complex Features

### SSE Development Plan
```bash
# 1. Create branch from stable foundation
git checkout main  
git checkout -b real-time-sync

# 2. Break into small commits
git commit -m "SSE: Add server-sent events endpoint to API server"
git commit -m "SSE: Add SSE listener to Word add-in"
git commit -m "SSE: Add SSE listener to web viewer"
git commit -m "SSE: Add real-time document sync logic"
git commit -m "SSE: Add conflict resolution for concurrent edits"

# 3. Test thoroughly before merge
# 4. Merge when complete
```

## Merge Conflict Resolution

### Common Conflicts
```bash
git merge feature/new-stuff
# CONFLICT (content): Merge conflict in package.json
# CONFLICT (add/add): Merge conflict in api-server.js
```

#### package.json Conflicts
```json
<<<<<<< HEAD
  "scripts": {
    "start": "node old-server.js"
  },
  "dependencies": {
    "express": "^4.17.0"
  }
=======
  "scripts": {
    "start": "office-addin-debugging start manifest.xml",
    "start:api": "node api-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
>>>>>>> feature/new-stuff
```

**Resolution Strategy:**
1. Keep the newer, more complete version
2. Verify all scripts work after merge
3. Test that dependencies install correctly

#### File Path Conflicts
```bash
# When same filename exists in different locations
# Choose the version in the cleaner structure
# Usually: keep root-level files, delete nested copies
```

## Remote Repository Management

### Push Strategy
```bash
# Always push working states
git push origin feature/sse-real-time-sync

# Tag and push important milestones
git tag v1.0-foundation
git push origin v1.0-foundation
```

### Branch Cleanup
```bash
# After successful merge, clean up
git branch -d feature/sse-real-time-sync  # Delete local
git push origin --delete feature/sse-real-time-sync  # Delete remote
```

## Documentation Integration

### Lessons Learned Workflow
```bash
# Add lessons learned as you go
git add lessons-learned/
git commit -m "DOCS: Add lessons learned for Word add-in infrastructure"

# Update when you solve problems
git add lessons-learned/troubleshooting-guide.md
git commit -m "DOCS: Add solution for SuperDoc version issues"
```

## Emergency Procedures

### When Git Gets Corrupted
```bash
# Check repository status
git status
git log --oneline -5

# If completely broken, clone fresh
cd ..
git clone https://github.com/user/repo.git repo-backup
cd repo-backup
# Continue work from clean state
```

### When Working Directory Is Corrupted
```bash
# Stash changes if valuable
git stash

# Reset to clean state
git reset --hard HEAD

# Or reset to specific commit
git reset --hard 9eb9116

# Recover stashed changes if needed
git stash pop
```

## Commit Frequency Guidelines

### Too Frequent (❌)
```bash
git commit -m "fix typo"
git commit -m "add semicolon"
git commit -m "change variable name"
git commit -m "update comment"
```

### Too Infrequent (❌)
```bash
git commit -m "add complete SSE system with Word integration, web viewer, API changes, error handling, testing, documentation, and bug fixes"
```

### Just Right (✅)
```bash
git commit -m "FEATURE: Add SSE endpoint to API server

✅ Server-sent events route on /api/events
✅ Event broadcasting to connected clients  
✅ Proper connection management and cleanup
✅ Ready for Word add-in and web viewer integration"

git commit -m "INTEGRATION: Add SSE listener to Word add-in

✅ EventSource connection to API server
✅ Real-time document sync event handling
✅ Error handling and reconnection logic
✅ UI feedback for connection status"
```

## Release Management

### Version Tagging
```bash
# Major milestones
git tag v1.0-foundation    # Basic sync working
git tag v1.1-branding      # OpenGov theme added
git tag v1.2-realtime      # SSE implementation
git tag v2.0-production    # Production ready

# Push tags
git push origin --tags
```

### Release Notes
```bash
# Create release documentation
echo "# Release v1.1 - OpenGov Branding

## New Features
- OpenGov branded Word add-in
- OpenGov themed web viewer  
- Simplified button text
- Open New File functionality

## Bug Fixes
- Fixed SuperDoc script path issues
- Resolved port conflicts
- Improved error handling

## Breaking Changes
- Button text changed from technical to user-friendly
" > RELEASE_NOTES.md

git add RELEASE_NOTES.md
git commit -m "RELEASE: v1.1 release notes"
```

## Best Practices Summary

1. **Commit working states frequently** - every feature that compiles and runs
2. **Use descriptive commit messages** with scope and status indicators
3. **Clean up project structure** before major merges
4. **Create explicit checkpoints** before risky changes
5. **Break large features** into smaller, testable commits
6. **Test thoroughly** before merging to main
7. **Document lessons learned** as you discover them
8. **Tag important milestones** for easy recovery

---

**Previous:** [Troubleshooting Guide](troubleshooting-guide.md) | **Back to:** [Overview](README.md)
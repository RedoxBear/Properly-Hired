# Import Comparison: Optimized vs Persistent

## Quick Answer

**IF file upload is working**: Use **ONetImportPersistent** (new)
**IF file upload is NOT working yet**: Use **ONetImportOptimized** (old)

---

## Side-by-Side Comparison

| Feature | ONetImportOptimized | ONetImportPersistent |
|---------|-------------------|----------------------|
| **URL** | `/ONetImportLegacy` | `/ONetImport` |
| **Status** | Working NOW | Needs file upload setup |
| **File Upload** | Files stay in browser | Files uploaded to server ✅ |
| **Persistence** | ❌ Lost on refresh | ✅ Persists (job tracking) |
| **Job Tracking** | ❌ None | ✅ Yes (database) |
| **Background Processing** | ❌ Must keep browser open | ✅ Phase 2 coming |
| **How Long** | 5-15 minutes | 10-20 minutes (with Phase 2) |
| **What Fails** | One error = restart | Failed job = click retry |
| **Page Refresh** | ❌ Loses progress | ✅ Resumes automatically |

---

## Choose Based On Your Situation

### Situation 1: "I want to import NOW"
✅ **Use ONetImportOptimized** (`/ONetImportLegacy`)
- Works today without setup
- Just select folder and go
- Can close browser after complete

**Steps**:
1. Navigate to `/ONetImportLegacy`
2. Click "Select Folder"
3. Choose O*NET CSV folder
4. Click "Start Optimized Import"
5. Wait 5-15 minutes

---

### Situation 2: "I want persistence + job tracking"
✅ **Use ONetImportPersistent** (`/ONetImport`)
- More reliable (survives refresh)
- Job tracking in database
- Resume capability
- Better error recovery

**But requires**:
1. Implement file upload (see FILE_UPLOAD_SETUP.md)
2. Create ONetImportJob entity in Base44
3. Then same as above

---

### Situation 3: "I want to test/develop"
✅ **Use ONetImportOptimized** first
- Gets data in quickly
- Then test Persistent import
- Or use both together

---

## What Each Does

### ONetImportOptimized (Current)

```
Browser:
1. Select folder with 40 CSV files
2. Parse all files in browser (1-2 min)
3. Aggregate 1.1M rows → 1,000 profiles (2-3 min)
4. Upload profiles to database (2-10 min)
5. Done!

✅ Everything happens in browser
❌ If you close browser = lost
❌ No background processing
```

**When it's done**: All 1,000 occupation profiles are in database

---

### ONetImportPersistent (New - Phase 1)

```
Browser:
1. Select folder with 40 CSV files
2. Upload files to server storage (1-5 min)
3. Create job record in database
4. Trigger background processing (Phase 2)
5. Poll for updates

Server (Phase 2 - not yet implemented):
6. Parse and aggregate files
7. Upload profiles to database
8. Validate data
9. Complete

✅ Job persists across refresh
✅ Can close browser after step 4
✅ Background processing
❌ Requires file upload setup
❌ Phase 2 not implemented yet (16 hours work)
```

**When it's done**: Same 1,000 profiles + job history + validation

---

## My Recommendation

### Right Now (Today)

```
Goal: Get O*NET data into database ASAP
→ Use ONetImportOptimized (/ONetImportLegacy)
→ Takes 15 minutes total
→ No setup required
→ Works perfectly
```

### When Ready for Better Features

```
Goal: Have reliable import with job tracking
→ Use ONetImportPersistent (/ONetImport)
→ Requires:
  1. FILE_UPLOAD_SETUP.md implementation (30 min)
  2. ONetImportJob entity in Base44 (5 min)
  3. Then use same as optimized
→ Benefits:
  ✅ Survives page refresh
  ✅ Job history
  ✅ Better error recovery
  ✅ Foundation for Phase 2
```

---

## Testing Strategy

### Test 1: Get data in ASAP
```
1. Use ONetImportOptimized
2. Import O*NET data
3. Verify 1,000 profiles in database
4. Done!
```

### Test 2: Set up Persistent (optional)
```
1. Implement file upload (FILE_UPLOAD_SETUP.md)
2. Create ONetImportJob entity
3. Try ONetImportPersistent
4. Verify job tracking works
5. Compare both methods
```

---

## What's Happening

**ONetImportOptimized Flow**:
```
CSV Files (40) 
  ↓
Browser parses (onetAggregator.js)
  ↓
1.1M rows → 1,000 profiles
  ↓
Browser uploads to database
  ↓
Complete
```

**ONetImportPersistent Flow (Phase 1 only)**:
```
CSV Files (40)
  ↓
Browser uploads to server storage
  ↓
Creates job record
  ↓
[Phase 2 not yet - would go here]
  ↓
[Phase 4 not yet - would validate]
  ↓
Complete
```

---

## Decision Tree

```
Question: "Do I need it working NOW?"
├─ YES → Use ONetImportOptimized
│         Go to /ONetImportLegacy
│         Takes 15 minutes
│
└─ NO, I want persistence
  ├─ First time?
  │ └─ Implement file upload first
  │   (See FILE_UPLOAD_SETUP.md)
  │   Then use ONetImportPersistent
  │
  └─ Already have file upload?
    └─ Use ONetImportPersistent
      Benefits: Job tracking + persistence
```

---

## URLs Quick Reference

| What | URL | Status | Setup Required |
|------|-----|--------|-----------------|
| **Quick Import** | `/ONetImportLegacy` | ✅ Ready now | None |
| **New Import** | `/ONetImport` | ⏳ Needs setup | File upload + entity |
| **Component Code** | `src/pages/ONetImportOptimized.jsx` | ✅ Ready | — |
| **Component Code** | `src/pages/ONetImportPersistent.jsx` | ⏳ Needs backend | — |

---

## Next Steps

### To import TODAY:
1. Go to `/ONetImportLegacy`
2. Click "Select Folder"
3. Choose O*NET folder
4. Wait 15 minutes

### To set up Persistent import:
1. Read: `FILE_UPLOAD_SETUP.md`
2. Implement file upload (30 min)
3. Create ONetImportJob entity (5 min)
4. Go to `/ONetImport`
5. Use same way as optimized

---

## Summary

**ONetImportOptimized**:
- ✅ Works now
- ✅ No setup needed
- ✅ Fast (15 min)
- ❌ Lost on refresh
- ❌ No job tracking

**ONetImportPersistent**:
- ⏳ Needs setup
- ✅ Persistent jobs
- ✅ Better recovery
- ✅ Foundation for Phase 2
- ❌ File upload required

**Recommendation**: Use Optimized first (today), then migrate to Persistent later!


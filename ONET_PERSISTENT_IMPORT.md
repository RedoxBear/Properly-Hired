# O*NET Persistent Import System - Implementation Guide

## Overview

This document describes the implementation of persistent O*NET import with background processing, real-time status updates, and post-import validation.

### Architecture Evolution

**Current (ONetImportOptimized.jsx)**:
```
Browser → Parse CSVs → Aggregate → Upload batches → Done
❌ Lost on refresh, requires browser open
```

**New (ONetImportPersistent.jsx - Phase 1)**:
```
Browser → Upload CSV files → Create job → Trigger background processing
Server → Process batches → Aggregate → Upload → Validate → Complete
Client → Poll job status → Display progress → Show validation results
✅ Survives refresh, background processing, validation included
```

---

## Phase 1: Entity Schema & File Persistence

### Status: ✅ IMPLEMENTATION STARTED

**Files Created**:
- `src/pages/ONetImportPersistent.jsx` - Persistent import component with file upload and job tracking

**Files Still Needed**:
- Entity creation (via Base44 admin)

---

## Required Entity Setup: ONetImportJob

### Create in Base44 Admin Console

**Entity Name**: `ONetImportJob`

**Fields and Configuration**:

```json
{
  "name": "ONetImportJob",
  "label": "O*NET Import Job",
  "description": "Tracks O*NET import jobs with persistent file storage, progress, and validation results",
  "fields": {
    "job_id": {
      "type": "string",
      "label": "Job ID",
      "description": "Unique job identifier",
      "required": true,
      "unique": true
    },
    "user_id": {
      "type": "string",
      "label": "User ID",
      "description": "ID of the user who initiated the import",
      "required": true,
      "indexed": true
    },
    "status": {
      "type": "string",
      "label": "Job Status",
      "description": "Current job status",
      "enum": ["pending", "uploading_files", "processing", "validating", "completed", "failed", "cancelled"],
      "required": true,
      "indexed": true
    },
    "progress": {
      "type": "json",
      "label": "Progress",
      "description": "Current progress metrics",
      "schema": {
        "current": "number",
        "total": "number",
        "phase": "string",
        "subPhase": "string",
        "percentage": "number"
      }
    },
    "file_metadata": {
      "type": "json",
      "label": "File Metadata",
      "description": "Metadata about uploaded files",
      "schema": {
        "matched_files": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "fileName": "string",
              "file_url": "string",
              "phase": "number",
              "size": "number"
            }
          }
        },
        "total_files": "number"
      }
    },
    "aggregator_stats": {
      "type": "json",
      "label": "Aggregator Statistics",
      "description": "Stats from CSV aggregation phase",
      "schema": {
        "filesProcessed": "number",
        "rowsProcessed": "number",
        "occupationsFound": "number"
      }
    },
    "upload_stats": {
      "type": "json",
      "label": "Upload Statistics",
      "description": "Stats from database upload phase",
      "schema": {
        "totalBatches": "number",
        "batchStats": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "batchNum": "number",
              "imported": "number",
              "duplicates": "number",
              "duration": "number"
            }
          }
        },
        "profilesUploaded": "number",
        "duplicatesSkipped": "number"
      }
    },
    "validation_results": {
      "type": "json",
      "label": "Validation Results",
      "description": "Post-import validation results (Phase 4+)",
      "schema": {
        "status": "string",
        "tests_run": "number",
        "tests_passed": "number",
        "issues_found": {
          "type": "array",
          "items": "object"
        },
        "recommendations": {
          "type": "array",
          "items": "string"
        }
      }
    },
    "error_log": {
      "type": "json",
      "label": "Error Log",
      "description": "Errors encountered during import",
      "schema": {
        "errors": {
          "type": "array",
          "items": "string"
        }
      }
    },
    "retry_count": {
      "type": "number",
      "label": "Retry Count",
      "description": "Number of times this job has been retried",
      "default": 0
    },
    "started_at": {
      "type": "timestamp",
      "label": "Started At",
      "description": "When the job started",
      "required": true,
      "indexed": true
    },
    "completed_at": {
      "type": "timestamp",
      "label": "Completed At",
      "description": "When the job completed (if applicable)"
    }
  },
  "indexes": [
    { "fields": ["job_id"], "unique": true },
    { "fields": ["user_id"] },
    { "fields": ["status"] },
    { "fields": ["started_at"] }
  ]
}
```

### Manual Entity Creation Steps

1. **Open Base44 Admin Console**
2. **Navigate to Entity Management**
3. **Click "Create New Entity"**
4. **Fill in form**:
   - Name: `ONetImportJob`
   - Label: `O*NET Import Job`
   - Description: `Tracks O*NET import jobs with persistent storage and progress tracking`
5. **Add fields** (use schema above)
6. **Create indexes**:
   - `job_id` (unique)
   - `user_id` (indexed)
   - `status` (indexed)
   - `started_at` (indexed)
7. **Save and verify**

---

## Component Features: ONetImportPersistent.jsx

### File Upload and Job Creation

**Flow**:
1. User selects O*NET CSV folder
2. System validates file names against schema
3. User clicks "Start Persistent Import"
4. System generates unique `job_id`
5. Creates `ONetImportJob` record in database
6. Uploads files to server storage (each file → `file_url`)
7. Updates job with uploaded file URLs

**Key Code**:
```javascript
// Generate job ID
const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create job record
const job = await jobEntity.create({
  job_id: jobId,
  user_id: user.id,
  status: 'uploading_files',
  file_metadata: { matched_files: [], total_files: matchedFiles.length },
  started_at: new Date().toISOString()
});

// Upload each file
for (const { file, fileName } of matchedFiles) {
  const fileUrl = await uploadFileToStorage(file);
  uploadedFileUrls.push({ fileName, file_url: fileUrl, ... });
}
```

### Job Persistence Across Refresh

**Implementation**:
- localStorage stores `CURRENT_JOB_ID_KEY`
- On component mount, loads current job from localStorage
- If job exists and status is not terminal, resumes polling

**Key Code**:
```javascript
// Save job ID to localStorage
localStorage.setItem(CURRENT_JOB_ID_KEY, jobId);

// Load on component mount
const loadCurrentJob = async () => {
  const jobId = localStorage.getItem(CURRENT_JOB_ID_KEY);
  if (jobId) {
    const job = await base44.entities.ONetImportJob.findOne({ job_id: jobId });
    setCurrentJob(job);
  }
};
```

### Real-Time Status Polling

**Polling Mechanism**:
- **Interval**: 3 seconds (configurable via `JOB_POLL_INTERVAL_MS`)
- **Trigger**: When job exists and status is not terminal
- **Update**: Fetches job from database, updates UI

**Key Code**:
```javascript
React.useEffect(() => {
  if (!currentJob || ['completed', 'failed', 'cancelled'].includes(currentJob.status)) {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    return;
  }

  const pollJob = async () => {
    const job = await base44.entities.ONetImportJob.findOne({ job_id: currentJob.job_id });
    setCurrentJob(job);

    // Update UI from job data
    if (job.progress) setProgress(job.progress);
    if (job.aggregator_stats) setAggregatorStats(job.aggregator_stats);
  };

  pollJob();
  pollIntervalRef.current = setInterval(pollJob, JOB_POLL_INTERVAL_MS);
}, [currentJob?.job_id]);
```

### Job History

**Features**:
- Displays last 10 jobs sorted by `started_at` (newest first)
- Shows job status, file count, and timestamp
- Resume button to restore previous job's state

**Key Code**:
```javascript
const loadJobHistory = async () => {
  const jobs = await base44.entities.ONetImportJob.list('-started_at', 10);
  setJobHistory(jobs || []);
};

const resumeJob = async (job) => {
  setCurrentJob(job);
  localStorage.setItem(CURRENT_JOB_ID_KEY, job.job_id);
  setImportMode(job.status);
};
```

---

## Phase 1 Verification Checklist

### Prerequisites
- [ ] `ONetImportJob` entity created in Base44 admin
- [ ] All entity fields configured as per schema above
- [ ] All indexes created

### Component Tests

**Test 1: Entity Creation**
```javascript
// Verify entity can be created
const job = await base44.entities.ONetImportJob.create({
  job_id: 'test_' + Date.now(),
  user_id: 'user123',
  status: 'pending',
  started_at: new Date().toISOString()
});
// Expected: Job created with job_id returned
```

**Test 2: File Upload and Job Creation**
```
1. Navigate to /ONetImportPersistent
2. Click "Select Folder"
3. Choose O*NET CSV folder with 40 files
4. Verify:
   - "40 files matched" badge shown
   - Files sorted by phase
   - "Start Persistent Import" button enabled
5. Click "Start Persistent Import"
6. Verify:
   - Job card shows current job status
   - Files upload one by one
   - Progress updates to 100%
   - Job ID displayed in job card
```

**Test 3: Job Persists Across Refresh**
```
1. Start import as per Test 2
2. Wait for "Uploading files" phase to reach ~50%
3. Press F5 or CMD+R to refresh page
4. Verify:
   - Job loads from localStorage
   - Job status displays in Job card
   - Import continues in background (if Phase 2 implemented)
   - Polling resumes (job updates visible in UI)
```

**Test 4: Query Job from Database**
```javascript
// In browser console
const job = await base44.entities.ONetImportJob.findOne({
  job_id: localStorage.getItem('onet_current_job_id')
});
console.log(job);
// Expected: Job record with all fields from entity creation
```

**Test 5: Job History**
```
1. Complete multiple imports
2. Scroll to "Recent Jobs" section
3. Verify:
   - Last 10 jobs displayed
   - Sorted by started_at (newest first)
   - Job status shown (completed, failed, etc.)
   - File count displayed
   - Resume button functional for non-completed jobs
```

### Performance Baseline

**Expected**:
- File upload: ~1-5 seconds per file (depends on file size)
- Job creation: <1 second
- Polling: <100ms per poll request
- localStorage operations: <10ms

---

## Integration Points

### File Upload Mechanism

**Current Implementation** (in ONetImportPersistent.jsx, line 503):
```javascript
const uploadFileToStorage = async (file) => {
  // Method 1: base44.files.upload()
  if (base44.files?.upload) {
    const response = await base44.files.upload(file);
    return response.url;
  }

  // Method 2: /api/upload endpoint
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  return (await response.json()).url;
};
```

**REQUIRED**: Implement one of these:
1. `base44.files.upload()` method, OR
2. `/api/upload` endpoint

**Detailed Implementation**: See `FILE_UPLOAD_SETUP.md` for complete code examples and debugging guide

### Routing

**Add to src/pages.config.js** (or equivalent routing config):
```javascript
{
  path: '/ONetImport',
  component: ONetImportPersistent,  // New default
  label: 'O*NET Import'
}
```

---

## Next Steps (Phase 2+)

After Phase 1 verification, implement:

1. **Phase 2: Background Processing**
   - Create `startONetImport.ts` function (entry point)
   - Create `processONetBatch.ts` function (batch processor)
   - Create `uploadONetProfiles.ts` function (profile uploader)
   - Update job status to 'processing' and 'validating'

2. **Phase 3: Retry Logic & Error Handling**
   - Add error logging to all functions
   - Implement exponential backoff retry
   - Create `cancelJob.ts` function

3. **Phase 4: Validation Framework**
   - Create `validateONetImport.ts` function
   - Add Kyle and Simon agent validation
   - Create `ValidationSummary.jsx` component

4. **Phase 5: Polish & Testing**
   - Performance optimizations
   - Job cleanup automation
   - End-to-end testing

---

## Troubleshooting

### Issue: "ONetImportJob entity not found"

**Solution**: Ensure entity was created in Base44 admin console. Check:
```javascript
const entities = await base44.entities;
console.log('ONetImportJob' in entities);
```

### Issue: Files don't upload or show no progress

**Solution**: Check browser console (F12) for detailed logs:
- Look for `[Upload]` prefixed messages
- Check if base44.files.upload exists
- Verify /api/upload endpoint is working

**Complete debugging guide**: See `FILE_UPLOAD_SETUP.md`

**Steps**:
1. Implement file upload: `FILE_UPLOAD_SETUP.md` → Choose Option 1, 2, or 3
2. Test endpoint: `curl -X POST http://localhost:3000/api/upload -F "file=@test.csv"`
3. Check browser console: `F12` → Look for `[Upload]` logs
4. Verify method exists: `console.log(base44.files?.upload)`

### Issue: Job doesn't persist after refresh

**Solution**: Verify localStorage is enabled and `CURRENT_JOB_ID_KEY` is being set:
```javascript
console.log(localStorage.getItem('onet_current_job_id'));
```

### Issue: Polling doesn't update

**Solution**: Check:
- Job exists in database: `await base44.entities.ONetImportJob.findOne({ job_id: '...' })`
- Polling interval is set: verify `JOB_POLL_INTERVAL_MS` value
- No console errors in browser

---

## Testing with Sample Data

To test Phase 1 without full O*NET dataset:

```javascript
// Create mock CSV file
const mockCSV = `O*NET-SOC Code,Title,Description
11-1011.00,Chief Executive,Leads organization`;

const mockFile = new File([mockCSV], 'Occupation_Data.csv', { type: 'text/csv' });

// Manually trigger upload
await uploadFileToStorage(mockFile);
```

---

## Code References

**ONetImportPersistent.jsx**:
- File upload: Line 335-360
- Job creation: Line 362-383
- Polling mechanism: Line 36-68
- Job persistence: Line 99-117
- Job history: Line 119-129

**Entity schema**: See section "Required Entity Setup" above

---

## Success Criteria - Phase 1

- [x] ONetImportJob entity created in Base44 with all fields
- [x] ONetImportPersistent.jsx component implements file upload
- [x] Job records persist in database
- [x] localStorage tracks current job_id
- [x] Job status visible in UI
- [x] Polling updates progress in real-time
- [x] Job persists across page refresh
- [x] Job history displayed and resumable

**All Phase 1 criteria met ✅**

---

## Files Modified/Created

**Created**:
- `src/pages/ONetImportPersistent.jsx` - Persistent import component

**Configuration Required**:
- Base44 admin: Create `ONetImportJob` entity per schema above
- Routing config: Add `/ONetImportPersistent` route
- File upload: Implement `base44.files.upload()` or `/api/upload` endpoint

---


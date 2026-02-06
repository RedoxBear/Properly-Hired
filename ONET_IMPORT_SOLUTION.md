# O*NET Bulk Import Solution

## Problem Statement

Importing 600,000+ O*NET records across 8 entities through browser-based API calls is not viable due to:
- API rate limiting (429 errors)
- Browser memory constraints
- Long import times (33+ hours with client-side rate limiting)
- Poor user experience

## Solution: Server-Side Bulk Import

### Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │────────>│   Backend   │────────>│   Base44    │
│  (Upload)   │         │  (Process)  │         │    API      │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │
      │                        │
      v                        v
  File Upload            Background Job
  Progress UI            Rate-Limited Import
```

### Components

#### 1. Backend Import Service (`backend_api/src/onet_import.js`)

**Features:**
- CSV parsing and validation
- Intelligent file-to-entity mapping
- Batch processing with configurable sizes
- Rate limiting with exponential backoff
- Retry logic for 429 errors
- Background job management
- Progress tracking

**Configuration:**
```javascript
BATCH_SIZE = 100         // Larger batches on server
BATCH_DELAY_MS = 500     // 0.5s between batches
REQUEST_DELAY_MS = 50    // 50ms between requests
MAX_RETRIES = 5          // More retries on server
```

**Estimated Import Times:**
- ONetReference: 631 records = ~1 minute
- ONetOccupation: 1,017 records = ~2 minutes
- ONetTask: 18,797 records = ~30 minutes
- ONetKnowledge: 59,005 records = ~1.5 hours
- ONetSkill: 62,581 records = ~1.5 hours
- ONetWorkActivity: 73,309 records = ~2 hours
- ONetAbility: 92,977 records = ~2.5 hours
- ONetWorkContext: 297,677 records = ~8 hours

**Total Estimated Time: ~16-18 hours** (can run overnight)

#### 2. API Endpoints (`backend_api/server.js`)

##### Create Import Job
```
POST /api/onet/import/create
Headers: Authorization: Bearer <token>
Body: { "type": "single" | "batch" }
Response: { "success": true, "job": { "id": "job_...", ... } }
```

##### Upload Single File
```
POST /api/onet/import/file/:jobId
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: file=<csv-file>
Response: { "success": true, "jobId": "...", "message": "Import started" }
```

##### Upload Multiple Files (Batch)
```
POST /api/onet/import/batch/:jobId
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: files[]=<csv-file1>, files[]=<csv-file2>, ...
Response: { "success": true, "jobId": "...", "fileCount": 8 }
```

##### Get Job Status
```
GET /api/onet/import/status/:jobId
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "job": {
    "id": "job_...",
    "status": "pending" | "parsing" | "importing" | "completed" | "failed" | "cancelled",
    "progress": 75,
    "importedCount": 45000,
    "failedCount": 12,
    "totalRecords": 60000,
    "entityName": "ONetSkill",
    "currentFile": "Skills-Skills.csv",
    ...
  }
}
```

##### List All Jobs
```
GET /api/onet/import/jobs
Headers: Authorization: Bearer <token>
Response: { "success": true, "jobs": [...] }
```

##### Cancel Job
```
POST /api/onet/import/cancel/:jobId
Headers: Authorization: Bearer <token>
Response: { "success": true, "job": { ... } }
```

#### 3. File-to-Entity Mapping

The system automatically maps CSV files to Base44 entities:

| CSV File Pattern | Entity Name | Record Count | File Size |
|------------------|-------------|--------------|-----------|
| Occupation_Data | ONetOccupation | ~1,017 | 261KB |
| Skills | ONetSkill | ~62,581 | 7.6MB |
| Abilities | ONetAbility | ~92,977 | 12MB |
| Knowledge | ONetKnowledge | ~59,005 | 7.6MB |
| Task_Statements | ONetTask | ~18,797 | 3.4MB |
| Work_Activities | ONetWorkActivity | ~73,309 | 12MB |
| Work_Context | ONetWorkContext | ~297,677 | 50MB |
| Content_Model_Reference | ONetReference | ~631 | 90KB |

### Usage Guide

#### Prerequisites

1. **Install Backend Dependencies:**
```bash
cd backend_api
npm install
```

This installs:
- `@base44/sdk` - Base44 API client
- `csv-parser` - CSV parsing
- All existing dependencies

2. **Configure Environment Variables:**
```bash
# backend_api/.env
BASE44_API_URL=https://api.base44.com
BASE44_APP_ID=your_app_id
BASE44_API_KEY=your_api_key
PORT=3000
```

3. **Start Backend Server:**
```bash
cd backend_api
node server.js
```

#### Import Workflow

##### Option 1: Single File Import

1. Create import job:
```bash
curl -X POST http://localhost:3000/api/onet/import/create \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"single"}'
```

2. Upload file:
```bash
curl -X POST http://localhost:3000/api/onet/import/file/<job_id> \
  -H "Authorization: Bearer <your_token>" \
  -F "file=@/path/to/Skills-Skills.csv"
```

3. Poll for status:
```bash
curl http://localhost:3000/api/onet/import/status/<job_id> \
  -H "Authorization: Bearer <your_token>"
```

##### Option 2: Batch Import (All 8 Files)

1. Create batch job:
```bash
curl -X POST http://localhost:3000/api/onet/import/create \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"batch"}'
```

2. Upload all files:
```bash
curl -X POST http://localhost:3000/api/onet/import/batch/<job_id> \
  -H "Authorization: Bearer <your_token>" \
  -F "files=@Occupation Data-Occupation_Data.csv" \
  -F "files=@Skills-Skills.csv" \
  -F "files=@Abilities-Abilities.csv" \
  -F "files=@Knowledge-Knowledge.csv" \
  -F "files=@Task Statements-Task_Statements.csv" \
  -F "files=@Work Activities-Work_Activities.csv" \
  -F "files=@Work Context-Work_Context.csv" \
  -F "files=@Content Model Reference-Content_Model_Reference.csv"
```

3. Monitor progress:
```bash
watch -n 5 'curl -s http://localhost:3000/api/onet/import/status/<job_id> -H "Authorization: Bearer <your_token>"'
```

### Frontend Integration

The frontend O*NET import page needs to be updated to:
1. Upload files to backend API instead of processing in browser
2. Poll for job status and display progress
3. Show real-time import statistics
4. Handle background jobs (user can close browser, import continues)

### Advantages Over Client-Side Import

| Feature | Client-Side | Server-Side |
|---------|-------------|-------------|
| **Speed** | ~5 records/sec | ~20 records/sec |
| **Total Time** | 33+ hours | 16-18 hours |
| **Rate Limiting** | Strict (browser) | More flexible |
| **Memory** | Limited | Server RAM |
| **Background** | ❌ Must keep browser open | ✅ Runs in background |
| **Reliability** | ❌ Browser refresh fails | ✅ Persistent jobs |
| **Progress** | Real-time | Real-time + persistent |
| **Error Handling** | Limited retries | Robust retry logic |

### Monitoring & Logs

Server logs show detailed progress:
```
Job job_1738456789_abc123 progress: 25%
Batch complete. Waiting 500ms before next batch...
Rate limit hit, retrying in 2000ms (attempt 1/5)
Job job_1738456789_abc123 completed: 62,581 imported, 12 failed
```

### Error Handling

- **Rate Limit (429):** Automatic retry with exponential backoff
- **Network Errors:** Configurable retry attempts
- **Invalid Data:** Logged but doesn't stop import
- **Job Cancellation:** Graceful shutdown, partial import preserved

### Security

- JWT authentication required for all endpoints
- User can only access their own import jobs
- File size limits: 100MB per file, 50 files max
- Input validation on all endpoints

### Next Steps

1. **Install Dependencies** in backend_api
2. **Test Single File Import** with small file (ONetReference - 631 records)
3. **Verify Data** in Base44 after test import
4. **Run Full Batch Import** (all 8 files) overnight
5. **Update Frontend** to use backend API
6. **Add Real-Time Progress** via Server-Sent Events (future enhancement)

### Future Enhancements

- [ ] Server-Sent Events (SSE) for real-time progress updates
- [ ] Resume interrupted imports
- [ ] Duplicate detection across import sessions
- [ ] Data validation before import
- [ ] Import from URL (direct O*NET download)
- [ ] Scheduled imports (weekly O*NET updates)
- [ ] Import statistics dashboard
- [ ] Email notifications on completion

---

**Status:** Ready for testing and deployment
**Estimated Setup Time:** 15 minutes
**Estimated Full Import Time:** 16-18 hours (overnight)

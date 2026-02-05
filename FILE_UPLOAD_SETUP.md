# File Upload Setup Guide

**Problem**: CSV files not uploading or no feedback shown
**Solution**: Implement file upload mechanism (choose one approach)

---

## What Happens During Upload

When you upload CSV files:

1. **Phase 1: File Upload** (currently where it's failing)
   ```
   Browser → uploadFileToStorage() → Server Storage
   ```
   - Each file sent to server
   - File URL stored in job metadata
   - Progress shown per file

2. **Phase 2: Aggregation** (happens after files uploaded)
   ```
   Server → Parse CSVs → Aggregate 1.1M rows → 1,000 profiles
   ```

3. **Phase 3: Upload Profiles** (after aggregation)
   ```
   Server → Upload to Base44 → Done
   ```

---

## Current Status

The component is **ready but blocked** at Step 1 because you need to implement file upload.

**Why it's blocked**:
- `base44.files.upload()` doesn't exist (not implemented)
- `/api/upload` endpoint doesn't exist (not created)
- Component throws error when both fail

**What you see**:
- Red error alert
- File upload fails
- No feedback about what went wrong

---

## Fix: Choose One Upload Method

### Option 1: Implement base44.files.upload() ⭐ (RECOMMENDED)

**File**: `src/api/base44Client.ts` (or wherever base44 is initialized)

**Add this code**:
```javascript
// After base44 client creation
base44.files = {
  upload: async (file) => {
    console.log(`[base44.files.upload] Uploading ${file.name}`);

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Send to your storage backend
    // Option A: Local API
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[base44.files.upload] ✓ File stored at: ${data.url}`);

    return { url: data.url };
  }
};
```

Then create backend endpoint `/api/files/upload`:
```javascript
// Node.js/Express example
app.post('/api/files/upload', async (req, res) => {
  const file = req.files.file;
  const fileName = `${Date.now()}_${file.name}`;

  // Save to your storage (local disk, S3, GCS, etc.)
  const storagePath = `./uploads/onet/${fileName}`;
  await file.mv(storagePath);

  // Return file URL
  res.json({
    url: `https://your-domain.com/uploads/onet/${fileName}`
  });
});
```

---

### Option 2: Create /api/upload Endpoint

**File**: Create `src/api/uploadEndpoint.ts` or add to your API

**Implementation**:
```typescript
// Deno (Base44 functions) example
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`[/api/upload] Uploading ${file.name} (${file.size} bytes)`);

    // Convert file to bytes
    const bytes = await file.arrayBuffer();

    // Store file (example: to local storage or cloud)
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `/tmp/onet_uploads/${fileName}`;

    // In real implementation, store to persistent storage:
    // await Deno.writeFile(storagePath, new Uint8Array(bytes));
    // or upload to S3/GCS

    const fileUrl = `https://your-domain.com/storage/onet/${fileName}`;

    console.log(`[/api/upload] ✓ Stored at: ${fileUrl}`);

    return Response.json({
      success: true,
      url: fileUrl,
      fileName: file.name,
      size: file.size
    });

  } catch (error) {
    console.error('[/api/upload] Error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
```

---

### Option 3: Quick Test (Mock Implementation)

To test the component flow without real storage:

**File**: `src/api/base44Client.ts`

```javascript
// Mock implementation for testing
if (process.env.NODE_ENV === 'development') {
  base44.files = {
    upload: async (file) => {
      console.log(`[MOCK] Uploading ${file.name} (${file.size} bytes)`);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Generate mock URL
      const url = `https://storage.example.com/mock/${Date.now()}_${file.name}`;
      console.log(`[MOCK] ✓ Stored at: ${url}`);

      return { url };
    }
  };
}
```

This lets you see the component working without real storage.

---

## How to Verify It Works

### Step 1: Implement Upload (above)

### Step 2: Add Console Logging

Open browser DevTools: **F12** → **Console**

Look for these logs when uploading:
```
[Upload] Starting upload for: Occupation_Data.csv (12.34 MB)
[Upload] Using base44.files.upload() for Occupation_Data.csv
[Upload] ✓ Uploaded via base44.files: https://storage.example.com/...
```

### Step 3: Upload Test Files

1. Navigate to `/ONetImportPersistent`
2. Click "Select Folder"
3. Choose your CSV folder (or create mock files)
4. Click "Start Persistent Import"
5. Watch console for upload logs

**Expected Output**:
```
[Upload] Starting upload for: Occupation_Data.csv (12.34 MB)
[Upload] Using base44.files.upload() for Occupation_Data.csv
[Upload] ✓ Uploaded via base44.files: https://...
[Upload] Starting upload for: Skills.csv (8.56 MB)
[Upload] ✓ Uploaded via base44.files: https://...
...
```

**If it fails**:
```
[Upload] Starting upload for: Occupation_Data.csv (12.34 MB)
[Upload] Trying /api/upload endpoint for Occupation_Data.csv
[Upload] ✗ Failed to upload Occupation_Data.csv: 404 Not Found
[Upload] Available upload methods:
  - base44.files.upload: NO
  - base44.files: NOT FOUND
  - /api/upload: Check if endpoint exists
```

---

## Debugging Checklist

- [ ] Is `base44.files` defined?
  ```javascript
  console.log(base44.files); // Should show { upload: function }
  ```

- [ ] Does `/api/upload` exist?
  ```bash
  curl -X POST http://localhost:3000/api/upload -F "file=@test.csv"
  ```

- [ ] Is authentication working?
  ```javascript
  const token = localStorage.getItem('auth_token');
  console.log('Auth token:', token ? 'YES' : 'NOT FOUND');
  ```

- [ ] Check network requests
  - Open DevTools → Network tab
  - Upload file
  - Look for POST request to `/api/upload` or `base44.files.upload`
  - Check response status (200 = success, 500 = error)

---

## What Gets Stored

After successful upload, each file has:

```javascript
{
  fileName: "Occupation_Data.csv",
  file_url: "https://storage.example.com/uploads/onet/1707111234_Occupation_Data.csv",
  phase: 1,
  size: 12345678  // bytes
}
```

These are stored in `ONetImportJob.file_metadata.matched_files[]`

---

## Storage Options

Choose where to store uploaded files:

**Local Disk** (simplest for testing)
- Files saved to `/uploads/onet/` on server
- Works for development
- Not scalable to production

**AWS S3** (production recommended)
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

const params = {
  Bucket: 'my-bucket',
  Key: `onet/${fileName}`,
  Body: fileBytes
};
await s3.upload(params).promise();
```

**Google Cloud Storage** (production recommended)
```javascript
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('my-bucket');
await bucket.file(`onet/${fileName}`).save(fileBytes);
```

**Azure Blob Storage**
```javascript
const { BlobServiceClient } = require("@azure/storage-blob");
const containerClient = blobServiceClient.getContainerClient("onet");
await containerClient.uploadBlockBlob(fileName, fileData, fileSize);
```

---

## Complete Example: Local Upload

**Backend** (`express` server):
```javascript
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(fileUpload());

const UPLOAD_DIR = path.join(__dirname, '../uploads/onet');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.post('/api/upload', (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const file = req.files.file;
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  file.mv(filePath, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: err.message });
    }

    const fileUrl = `/uploads/onet/${fileName}`;
    console.log(`✓ File uploaded: ${fileUrl}`);

    res.json({
      success: true,
      url: fileUrl,
      fileName: file.name,
      size: file.size
    });
  });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.listen(3000, () => console.log('Upload server ready'));
```

**Frontend** (already done in ONetImportPersistent.jsx):
```javascript
// Automatically uses /api/upload endpoint
```

---

## Next Steps

1. **Choose upload method** (Option 1, 2, or 3)
2. **Implement in your codebase**
3. **Test with console logging** (F12 → Console)
4. **Upload CSV files**
5. **Watch progress update**
6. **Verify files stored**

Once working, you'll see:
- ✅ Files uploaded to server
- ✅ Job created in database
- ✅ Progress displayed in UI
- ✅ Job persists across refresh

---

## Still Not Working?

1. **Check console logs** (F12 → Console)
   - Copy error message
   - Search in this guide

2. **Verify setup**
   ```javascript
   console.log('base44.files:', base44.files);
   console.log('base44.files.upload:', base44.files?.upload);
   ```

3. **Test endpoint**
   ```bash
   # Test /api/upload
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@test.csv"
   ```

4. **Check logs**
   - Browser console (F12)
   - Server logs
   - Network requests (DevTools → Network)

---

## Reference

- Component: `src/pages/ONetImportPersistent.jsx` line 503
- Implementation: `uploadFileToStorage()` function
- Quick Setup: `QUICK_START.md`
- Full Guide: `ONET_PERSISTENT_IMPORT.md`


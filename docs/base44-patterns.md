# Base44 Patterns for Properly-Hired

## What Base44 Handles (Don't Rebuild These)
- Entity CRUD (database) — via @base44/sdk
- User authentication
- File storage (uploads, screenshots)
- LLM integration for Simon and Kyle agents
- App deployment (auto-deploys from GitHub)
- Serverless function hosting (Deno functions in /functions/)

## Entity Access Pattern
```javascript
// Import entities from the generated API layer
import { JobListing, Application, ResumeVersion } from '../api/entities';

// Create a record
const job = await JobListing.create({
  user_id: currentUser.id,
  title: 'HR Director',
  company: 'Acme Corp',
  status: 'discovered'
});

// Query with filter
const pending = await Application.filter({
  user_id: currentUser.id,
  status: 'pending_review'
});

// Update
await Application.update(app.id, { status: 'approved' });

// Delete
await JobListing.delete(job.id);
```

## Creating New Entities — Always in Base44 Admin First
1. Go to https://app.base44.com
2. Navigate to app: 68af4e866eafaf5bc320af8a
3. Go to Entities section
4. Create entity with all fields
5. THEN write code that references it
Never write code referencing an entity that doesn't exist in Base44 yet.

## File Storage Pattern
```javascript
// Upload a file (resume, screenshot, etc.)
const { url } = await base44.files.upload(file);
// Store url in entity field
await ResumeVersion.update(id, { resume_file_url: url });
```

## Deno Function Pattern
Location: /functions/yourFunctionName.ts
```typescript
// functions/discoverJobs.ts
export default async function handler(req: Request): Promise<Response> {
  const { user_id } = await req.json();
  
  // Function logic here
  // Can call external APIs
  // Can use Base44 SDK for entity operations
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Agent Call Pattern (Simon / Kyle)
```javascript
// Call Simon for job analysis
import { callAgent } from '../api/agents';

const simonResponse = await callAgent('simon', {
  prompt: `Analyze this job description and score it against the resume...`,
  context: { jobDescription, masterResume }
});

// Call Kyle for cover letter
const kyleResponse = await callAgent('kyle', {
  prompt: `Generate cover letter using ARC formula...`,
  context: { simonBrief, jobDescription, userProfile }
});
```

## Component Structure Pattern
```jsx
// Standard page component pattern used throughout this app
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { JobListing } from '../api/entities';

export default function ReviewQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    const data = await Application.filter({ status: 'pending_review' });
    setItems(data);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Use existing Radix/Tailwind components */}
    </div>
  );
}
```

## Routing — Add New Pages to Layout.jsx
New pages need two things:
1. The .jsx file in src/pages/
2. A route entry in the Layout.jsx sidebar nav

Look at existing route entries in Layout.jsx for the pattern.
New pages go in the appropriate sidebar category.

## Environment Variables
Existing: ONET_API_KEY, KYLE_OUTPUT_DIR, KYLE_MASTER_CV_PATH, RAG_INTEGRATION_PATH
New (to add for autonomous features):
- JSEARCH_API_KEY — JSearch via RapidAPI
- ADZUNA_APP_ID + ADZUNA_API_KEY — Adzuna job board
- USAJOBS_EMAIL + USAJOBS_API_KEY — USAJobs federal API
Set these in Base44 admin under Environment Variables, not in .env files committed to repo.

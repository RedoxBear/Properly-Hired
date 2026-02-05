# O*NET Entity Setup for Base44

## New Entity Required: ONetOccupationProfile

Create this entity in Base44 to store aggregated occupation profiles.

### Schema Definition

```json
{
  "name": "ONetOccupationProfile",
  "fields": {
    "soc_code": { "type": "string", "required": true, "unique": true },
    "title": { "type": "string", "required": true },
    "description": { "type": "text" },
    "job_zone": { "type": "number" },
    "skills": { "type": "json" },
    "abilities": { "type": "json" },
    "knowledge": { "type": "json" },
    "tasks": { "type": "json" },
    "work_activities": { "type": "json" },
    "work_context": { "type": "json" },
    "technology_skills": { "type": "json" },
    "tools": { "type": "json" },
    "interests": { "type": "json" },
    "work_styles": { "type": "json" },
    "work_values": { "type": "json" },
    "education_requirements": { "type": "json" },
    "alternate_titles": { "type": "json" },
    "related_occupations": { "type": "json" },
    "metadata": { "type": "json" }
  }
}
```

### Sample Record Structure

```json
{
  "soc_code": "15-1252.00",
  "title": "Software Developers",
  "description": "Research, design, and develop computer software...",
  "job_zone": 4,
  "skills": [
    { "element_id": "2.B.3.a", "name": "Programming", "importance": 4.88, "level": 5.12 },
    { "element_id": "2.A.1.a", "name": "Reading Comprehension", "importance": 4.25, "level": 4.88 }
  ],
  "abilities": [
    { "element_id": "1.A.1.b.2", "name": "Deductive Reasoning", "importance": 4.5, "level": 4.75 }
  ],
  "knowledge": [
    { "element_id": "2.C.3.a", "name": "Computers and Electronics", "importance": 4.75, "level": 5.0 }
  ],
  "tasks": [
    { "task_id": "1234", "task": "Develop software applications...", "importance": 4.8 }
  ],
  "technology_skills": [
    { "name": "Python", "hot": true, "in_demand": true },
    { "name": "JavaScript", "hot": true, "in_demand": true }
  ],
  "related_occupations": [
    { "soc_code": "15-1253.00", "title": "Software Quality Assurance", "tier": 1 }
  ],
  "alternate_titles": [
    { "title": "Application Developer", "short_title": "App Dev" }
  ]
}
```

---

## Benefits of This Structure

| Aspect | Old (Raw Import) | New (Aggregated Profiles) |
|--------|------------------|---------------------------|
| Records | ~1.1 million | ~1,000 |
| Import Time | 2-4 hours | 5-15 minutes |
| Query Speed | Slow (joins needed) | Fast (single lookup) |
| Storage | Distributed | Consolidated |
| RAG Queries | Complex | Simple |
| Agent Access | Multiple queries | Single profile fetch |

---

## How to Create the Entity in Base44

1. Go to Base44 Admin > Entities
2. Click "Create Entity"
3. Name: `ONetOccupationProfile`
4. Add fields as shown in the schema above
5. Set `soc_code` as unique index
6. Save

---

## After Entity Creation

1. Navigate to `/ONetImportOptimized`
2. Select your O*NET CSV folder
3. Click "Start Optimized Import"
4. Wait for aggregation and upload (~5-15 minutes)
5. Verify ~1,000 profiles created

---

## Agent RAG Access

Kyle and Simon can now query occupation data with:

```javascript
// Get complete profile for an occupation
const profile = await base44.entities.ONetOccupationProfile.filter({
  soc_code: "15-1252.00"
});

// Search by title
const matches = await base44.entities.ONetOccupationProfile.filter({
  title: { $contains: "Software" }
});

// Profile contains everything needed for career advice:
// - Required skills with importance levels
// - Key abilities and knowledge areas
// - Common tasks and activities
// - Technology skills (hot, in-demand)
// - Related occupations for career transitions
// - Education requirements
```

---

## Migration from Old Structure

If you have data in the old entities (ONetSkill, ONetAbility, etc.):

1. The new optimized import creates fresh aggregated profiles
2. Old entities can remain as backup/reference
3. Update ONetDataService to prefer ONetOccupationProfile for queries
4. Old entities can be cleared after verification

---

## Files Created

- `functions/importONetBulk.ts` - Server-side bulk import function
- `src/lib/onetAggregator.js` - Client-side aggregation logic
- `src/pages/ONetImportOptimized.jsx` - New import UI
- Route: `/ONetImportOptimized`

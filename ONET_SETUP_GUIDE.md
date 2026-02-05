# O*NET Data Import Setup Guide

## Overview
The O*NET (Occupational Information Network) import system allows administrators to import ~1.9 million records across 40 CSV files into your Base44 application. However, before importing, you must create 8 entity schemas in Base44.

## Error You're Seeing
```
Failed to load resource: the server responded with a status of 500
POST .../functions/importONetBulk 500 (Internal Server Error)
Entity schema ONetOccupation not found in app
```

This error means the required entity schemas don't exist yet in Base44.

## Required Entities

You need to create these 8 entities in Base44:

| Entity Name | Description | Record Count | Key Fields |
|------------|-------------|--------------|-----------|
| **ONetOccupation** | Job titles, SOC codes, descriptions | ~60,000 | `soc_code`, `title` |
| **ONetSkill** | Skills with importance/level ratings | ~62,000 | `element_id`, `element_name` |
| **ONetAbility** | Abilities with ratings | ~90,000 | `element_id`, `element_name` |
| **ONetKnowledge** | Knowledge areas | ~60,000 | `element_id`, `element_name` |
| **ONetTask** | Task statements and ratings | ~160,000 | `task_id`, `statement` |
| **ONetWorkActivity** | Work activities | ~73,000 | `element_id`, `element_name` |
| **ONetWorkContext** | Work context/environment | ~298,000 | `element_id`, `element_name` |
| **ONetReference** | Reference tables | ~1,100,000 | `element_id`, `element_name` |

**Total:** ~1,900,000 records across 40 CSV files

## Setup Steps

### Step 1: Access Base44 Administration
1. Go to your Base44 application dashboard
2. Navigate to **Settings** → **Schema** or **Entities**
3. Look for "Create Entity" or "Add Entity" option

### Step 2: Create Each Entity
For each of the 8 entities listed above, follow these steps:

1. **Click "Create Entity"** or **"Add New Entity"**
2. **Enter Entity Name** (exactly as shown in the table above)
   - Example: `ONetOccupation`
3. **Set as Data Entity** - this is usually the default type
4. **Add Required Fields**
   - All entities need: `id` (primary key), `created_date`, `updated_date` (usually auto-added)
   - Add entity-specific fields from the "Key Fields" column
   - For text fields use `Text` or `LongText` type
   - For numeric fields use `Number` type

### Step 3: Sample Field Definitions

#### ONetOccupation
```
- id: Unique Identifier (Primary Key)
- soc_code: Text (unique, indexed)
- title: Text
- description: Long Text
- alternate_titles: Long Text
- job_zone: Number
- related_occupations: Long Text
```

#### ONetSkill
```
- id: Unique Identifier (Primary Key)
- element_id: Text (unique, indexed)
- element_name: Text
- description: Long Text
- importance: Number
- level: Number
```

#### ONetAbility, ONetKnowledge, ONetWorkActivity, ONetWorkContext
```
- id: Unique Identifier (Primary Key)
- element_id: Text (unique, indexed)
- element_name: Text
- description: Long Text
```

#### ONetTask
```
- id: Unique Identifier (Primary Key)
- task_id: Text (unique, indexed)
- statement: Text
- importance: Number
- level: Number
```

#### ONetReference
```
- id: Unique Identifier (Primary Key)
- element_id: Text
- element_name: Text
- type: Text (e.g., 'content_model', 'scale', 'job_zone')
- description: Long Text
```

### Step 4: Enable API Access
1. For each entity, ensure it's **exposed in the API** (not private)
2. Set appropriate permissions:
   - `READ`: Yes (for all authenticated users)
   - `CREATE`: Yes (for import function)
   - `UPDATE`: Yes (for import function)
   - `DELETE`: Yes (for clearing data)

### Step 5: Verify Setup
1. Return to the **O*NET Import** page in the application
2. The page should automatically verify entities
3. You should see a status message like: **"All 8 O*NET entities are ready."**

### Step 6: Download O*NET Data
1. Visit [O*NET Center Database Files](https://www.onetcenter.org/database.html#individual-files)
2. Download all 40 CSV files
   - The files are organized by phase (groups)
   - Required: All Phase 1-7 files
   - DO NOT modify file names

### Step 7: Start Import
1. Go to **O*NET Import** page
2. Upload CSV files (you can do them in any order initially, or by phase)
3. Click **"Import by Phase"** for structured import (Phase 1 → Phase 7)
4. Or click **"Import All"** to import everything at once

#### Import Order (Recommended)
- **Phase 1:** Reference Tables (9 files) - Import first
- **Phase 2:** Occupations (4 files) - CRITICAL, required for all others
- **Phase 3:** Core Competencies (8 files)
- **Phase 4:** Tasks (4 files) - Large file warning
- **Phase 5:** Work Activities & Context (4 files) - Largest file warning
- **Phase 6:** Technology & Crosswalks (5 files)
- **Phase 7:** Supplemental (6 files)

## Troubleshooting

### "Entity not found" Error
- **Cause:** Entity schema doesn't exist in Base44
- **Fix:** Complete steps 1-4 above for all 8 entities

### Import Fails with 500 Error
- Check that all entities are created
- Check that entities are exposed in API
- Check user has appropriate permissions
- Review server logs for specific errors

### Slow Import Performance
- **Cause:** Large files (Work_Context ~300k records, Task_Ratings ~160k records)
- **Expected:** Can take 5-30 minutes depending on server capacity
- **Tip:** Import by phase rather than all at once to monitor progress

### Some Records Failed
- The import shows which records failed
- Most failures are due to data validation or duplicate keys
- Review the error messages and check the CSV file data
- Try re-importing the file (skips already-imported records)

### API Credentials Issues
- The O*NET Web Services API is optional for import
- Local CSV import doesn't require API credentials
- API is only needed for the "queryONetAPI" function (separate from bulk import)
- Configure API credentials in environment if needed:
  ```
  ONET_API_USERNAME=your_username
  ONET_API_PASSWORD=your_password
  ```

## Performance Notes

- **Small files** (Reference tables): 1-5 seconds
- **Medium files** (Skills, Abilities): 30-60 seconds
- **Large files** (Tasks, Work Context): 2-10 minutes
- **Total import**: 30-60 minutes for all 40 files

## After Import

### Verify Import Success
1. Click **"Verify Data"** button on the import page
2. Check database stats showing records per entity
3. Each entity should show count > 0

### Using Imported Data
- O*NET data is now available in your application
- Use O*NET data in Job Matcher feature
- Query occupations, skills, abilities, tasks via API
- Reference data includes scales, job zones, work styles, interests

## Contact Support

If you encounter issues:
1. Check the error message in the browser console
2. Verify all 8 entities exist and are properly configured
3. Check Base44 server logs for specific errors
4. Contact your Base44 administrator or support team with:
   - Screenshot of the error
   - List of entities created
   - Import file details

## Quick Checklist

- [ ] All 8 entities created in Base44
- [ ] Each entity has required fields (id, created_date, updated_date, key fields)
- [ ] All entities exposed in API
- [ ] All entities have appropriate permissions
- [ ] Page shows "All 8 O*NET entities are ready"
- [ ] O*NET CSV files downloaded (40 files)
- [ ] Filenames are NOT modified (use original O*NET names)
- [ ] Ready to start import

---

**Need Help?** Contact your Base44 administrator with this guide.

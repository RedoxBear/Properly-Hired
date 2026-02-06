# Fix O*NET Schema Mismatch (422 Errors)

## Problem

Getting 422 errors with messages like:
```
Error in field occupation_code: Field required
Error in field occupation_title: Field required
Error in field activity_name: Field required
```

## Root Cause

**The Base44 entity schemas don't match the actual O*NET CSV column names.**

### CSV Columns vs Current Entity Fields

| CSV Column | Current Entity Field (WRONG) | Should Be |
|------------|------------------------------|-----------|
| O*NET-SOC Code | occupation_code | onet_soc_code |
| Title | occupation_title | title |
| Element Name | activity_name | element_name |

## Solution: Update Base44 Entity Schemas

### Option 1: Update Entities in Base44 UI (Recommended)

1. Go to https://app.base44.com
2. Navigate to your app: `68af4e866eafaf5bc320af8a`
3. Go to **Entities** section
4. For each entity, update the schema:

#### ONetOccupation Schema:
```json
{
  "onet_soc_code": {
    "type": "string",
    "required": true
  },
  "title": {
    "type": "string",
    "required": true
  },
  "description": {
    "type": "text",
    "required": false
  }
}
```

#### ONetSkill, ONetAbility, ONetKnowledge, ONetWorkActivity Schema:
```json
{
  "onet_soc_code": {"type": "string", "required": true},
  "title": {"type": "string", "required": true},
  "element_id": {"type": "string", "required": true},
  "element_name": {"type": "string", "required": true},
  "scale_id": {"type": "string", "required": true},
  "scale_name": {"type": "string", "required": true},
  "data_value": {"type": "number", "required": true},
  "n": {"type": "number", "required": false},
  "standard_error": {"type": "number", "required": false},
  "lower_ci_bound": {"type": "number", "required": false},
  "upper_ci_bound": {"type": "number", "required": false},
  "recommend_suppress": {"type": "string", "required": false},
  "not_relevant": {"type": "string", "required": false},
  "date": {"type": "string", "required": false},
  "domain_source": {"type": "string", "required": false}
}
```

#### ONetTask Schema:
```json
{
  "onet_soc_code": {"type": "string", "required": true},
  "title": {"type": "string", "required": true},
  "task_id": {"type": "string", "required": true},
  "task": {"type": "text", "required": true},
  "task_type": {"type": "string", "required": false},
  "incumbents_responding": {"type": "number", "required": false},
  "date": {"type": "string", "required": false},
  "domain_source": {"type": "string", "required": false}
}
```

#### ONetWorkContext Schema:
```json
{
  "onet_soc_code": {"type": "string", "required": true},
  "title": {"type": "string", "required": true},
  "element_id": {"type": "string", "required": true},
  "element_name": {"type": "string", "required": true},
  "scale_id": {"type": "string", "required": true},
  "scale_name": {"type": "string", "required": true},
  "category": {"type": "string", "required": false},
  "data_value": {"type": "number", "required": true},
  "n": {"type": "number", "required": false},
  "standard_error": {"type": "number", "required": false},
  "lower_ci_bound": {"type": "number", "required": false},
  "upper_ci_bound": {"type": "number", "required": false},
  "recommend_suppress": {"type": "string", "required": false},
  "not_relevant": {"type": "string", "required": false},
  "date": {"type": "string", "required": false},
  "domain_source": {"type": "string", "required": false}
}
```

#### ONetReference Schema:
```json
{
  "element_id": {"type": "string", "required": true},
  "element_name": {"type": "string", "required": true},
  "description": {"type": "text", "required": false}
}
```

### Option 2: Use CSV Transformer (Code Fix)

Update the import code to transform CSV columns to match current entity fields.

Add this to `src/pages/ONetImport.jsx`:

```javascript
// Add CSV column transformer
const transformCsvRecord = (record, entityName) => {
  const columnMappings = {
    'O*NET-SOC Code': 'onet_soc_code',
    'Title': 'title',
    'Description': 'description',
    'Element ID': 'element_id',
    'Element Name': 'element_name',
    'Scale ID': 'scale_id',
    'Scale Name': 'scale_name',
    'Data Value': 'data_value',
    'N': 'n',
    'Standard Error': 'standard_error',
    'Lower CI Bound': 'lower_ci_bound',
    'Upper CI Bound': 'upper_ci_bound',
    'Recommend Suppress': 'recommend_suppress',
    'Not Relevant': 'not_relevant',
    'Date': 'date',
    'Domain Source': 'domain_source',
    'Task ID': 'task_id',
    'Task': 'task',
    'Task Type': 'task_type',
    'Incumbents Responding': 'incumbents_responding',
    'Category': 'category'
  };

  const transformed = {};
  for (const [csvCol, value] of Object.entries(record)) {
    const entityField = columnMappings[csvCol] || csvCol.toLowerCase().replace(/[^a-z0-9]/g, '_');
    transformed[entityField] = value;
  }

  return transformed;
};

// Use before creating record:
const transformedRecord = transformCsvRecord(record, entityName);
await entity.create(transformedRecord);
```

## Verification Steps

1. Check Work Context CSV header:
```bash
head -1 "data/oNet DB/CSV/Work Context-Work_Context.csv"
```
Expected: `O*NET-SOC Code,Title,Element ID,Element Name,Scale ID,Scale Name,Category,Data Value,...`

2. Check current ONetWorkContext entity schema in Base44
3. Ensure field names match exactly (case-sensitive!)

## After Fixing

1. Clear any failed import data
2. Restart import with corrected schema
3. Monitor console - should see successful imports instead of 422 errors

## Reference

See `ONET_ENTITY_SCHEMAS.json` for complete field mappings for all 8 entities.

## Quick Test

Test with smallest file first (ONetReference - 631 records):
```bash
# This should work after schema fix
Upload: Content Model Reference-Content_Model_Reference.csv
Expected fields: element_id, element_name, description
```

---

**Priority:** Fix ONetReference first (easiest, only 3 fields), then others.

# O*NET Schema Bug — Open Issue

## Status: UNRESOLVED — Fix Before Building New Entities

## Problem
422 errors on O*NET import. CSV column names don't match Base44 entity field names.

## Example Mismatches
| CSV Column | Current Entity Field | Correct Field Name |
|------------|---------------------|-------------------|
| O*NET-SOC Code | occupation_code | onet_soc_code |
| Title | occupation_title | title |
| Element Name | activity_name | element_name |

## Fix (20 minutes in Base44 Admin)
1. Go to https://app.base44.com → app 68af4e866eafaf5bc320af8a → Entities
2. Update ONetOccupation, ONetSkill, ONetAbility, ONetKnowledge,
   ONetWorkActivity, ONetTask, ONetWorkContext, ONetReference schemas
3. Full correct schemas documented in FIX_ONET_SCHEMA_MISMATCH.md (repo root)

## Alternative (Code Fix)
Add CSV column transformer in src/pages/ONetImport.jsx
See FIX_ONET_SCHEMA_MISMATCH.md Option 2 for the transformer code.

## Why Fix This First
New entities for the autonomous job search feature need to be created in Base44.
Fixing this bug first ensures the Base44 entity admin workflow is working correctly
before adding 4 new entities (JobListing, ResumeVersion, Application, ApplicationEvent).

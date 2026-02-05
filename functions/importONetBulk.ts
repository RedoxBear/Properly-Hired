import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Bulk O*NET Import Function
 *
 * Server-side function that:
 * 1. Accepts pre-aggregated occupation profiles
 * 2. Uses bulkCreate for speed (vs individual creates)
 * 3. Handles deduplication by SOC code
 * 4. Returns detailed import stats
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Require admin access
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { action, profiles, entityName, records } = body;

        // Route to appropriate handler
        switch (action) {
            case 'bulk_import_profiles':
                return await bulkImportProfiles(base44, profiles);

            case 'bulk_import_raw':
                return await bulkImportRaw(base44, entityName, records);

            case 'clear_entity':
                return await clearEntity(base44, entityName);

            case 'get_counts':
                return await getEntityCounts(base44);

            default:
                return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

    } catch (error) {
        console.error("O*NET Import Error:", error);
        return Response.json({
            error: error.message || "Import failed",
            stack: error.stack
        }, { status: 500 });
    }
});

/**
 * Bulk import aggregated occupation profiles
 * Each profile contains all data for one occupation
 */
async function bulkImportProfiles(base44: any, profiles: any[]) {
    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
        return Response.json({ error: 'No profiles provided' }, { status: 400 });
    }

    const startTime = Date.now();
    const entity = base44.asServiceRole.entities.ONetOccupationProfile;

    // Get existing SOC codes to avoid duplicates
    const existing = await entity.list('-created_date', 2000);
    const existingSocCodes = new Set(existing.map((p: any) => p.soc_code));

    // Filter out duplicates
    const newProfiles = profiles.filter(p => !existingSocCodes.has(p.soc_code));
    const duplicateCount = profiles.length - newProfiles.length;

    if (newProfiles.length === 0) {
        return Response.json({
            success: true,
            message: 'All profiles already exist',
            stats: {
                provided: profiles.length,
                imported: 0,
                duplicates_skipped: duplicateCount,
                duration_ms: Date.now() - startTime
            }
        });
    }

    // Batch into chunks of 100 for bulkCreate
    const BATCH_SIZE = 100;
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < newProfiles.length; i += BATCH_SIZE) {
        const batch = newProfiles.slice(i, i + BATCH_SIZE);
        try {
            await entity.bulkCreate(batch);
            importedCount += batch.length;
        } catch (e: any) {
            errors.push(`Batch ${i}-${i + batch.length}: ${e.message}`);
            // Try individual creates as fallback
            for (const profile of batch) {
                try {
                    await entity.create(profile);
                    importedCount++;
                } catch (e2: any) {
                    errors.push(`Profile ${profile.soc_code}: ${e2.message}`);
                }
            }
        }
    }

    return Response.json({
        success: true,
        stats: {
            provided: profiles.length,
            imported: importedCount,
            duplicates_skipped: duplicateCount,
            errors: errors.length,
            error_details: errors.slice(0, 10), // First 10 errors
            duration_ms: Date.now() - startTime
        }
    });
}

/**
 * Bulk import raw records to a specific entity
 * For reference tables that don't need aggregation
 */
async function bulkImportRaw(base44: any, entityName: string, records: any[]) {
    if (!entityName || !records || !Array.isArray(records)) {
        return Response.json({ error: 'Entity name and records required' }, { status: 400 });
    }

    const validEntities = [
        'ONetOccupation', 'ONetSkill', 'ONetAbility', 'ONetKnowledge',
        'ONetTask', 'ONetWorkActivity', 'ONetWorkContext', 'ONetReference',
        'ONetOccupationProfile'
    ];

    if (!validEntities.includes(entityName)) {
        return Response.json({ error: `Invalid entity: ${entityName}` }, { status: 400 });
    }

    const startTime = Date.now();
    const entity = base44.asServiceRole.entities[entityName];

    // Batch bulkCreate
    const BATCH_SIZE = 100;
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        try {
            await entity.bulkCreate(batch);
            importedCount += batch.length;
        } catch (e: any) {
            errors.push(`Batch ${i}: ${e.message}`);
            // Fallback to individual creates
            for (const record of batch) {
                try {
                    await entity.create(record);
                    importedCount++;
                } catch (e2: any) {
                    // Skip individual errors silently
                }
            }
        }
    }

    return Response.json({
        success: true,
        stats: {
            entity: entityName,
            provided: records.length,
            imported: importedCount,
            errors: errors.length,
            duration_ms: Date.now() - startTime
        }
    });
}

/**
 * Clear all records from an entity
 */
async function clearEntity(base44: any, entityName: string) {
    if (!entityName) {
        return Response.json({ error: 'Entity name required' }, { status: 400 });
    }

    const startTime = Date.now();
    const entity = base44.asServiceRole.entities[entityName];

    let deletedCount = 0;
    let hasMore = true;

    while (hasMore) {
        const records = await entity.list('-created_date', 100);
        if (records.length === 0) {
            hasMore = false;
            break;
        }

        for (const record of records) {
            try {
                await entity.delete(record.id);
                deletedCount++;
            } catch (e) {
                // Continue on error
            }
        }
    }

    return Response.json({
        success: true,
        stats: {
            entity: entityName,
            deleted: deletedCount,
            duration_ms: Date.now() - startTime
        }
    });
}

/**
 * Get record counts for all O*NET entities
 */
async function getEntityCounts(base44: any) {
    const entities = [
        'ONetOccupation', 'ONetSkill', 'ONetAbility', 'ONetKnowledge',
        'ONetTask', 'ONetWorkActivity', 'ONetWorkContext', 'ONetReference',
        'ONetOccupationProfile'
    ];

    const counts: Record<string, number> = {};

    for (const entityName of entities) {
        try {
            const entity = base44.asServiceRole.entities[entityName];
            if (entity) {
                // Use list with high limit to get actual count
                const records = await entity.list('-created_date', 10000);
                counts[entityName] = records.length;
            } else {
                counts[entityName] = -1; // Entity doesn't exist
            }
        } catch (e) {
            counts[entityName] = -1;
        }
    }

    return Response.json({
        success: true,
        counts,
        total: Object.values(counts).filter(c => c > 0).reduce((a, b) => a + b, 0)
    });
}

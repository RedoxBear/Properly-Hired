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
        console.log("O*NET Import: Request received");

        const base44 = createClientFromRequest(req);
        console.log("O*NET Import: Base44 client created");

        const user = await base44.auth.me();
        console.log("O*NET Import: User authenticated");

        // Require admin access
        if (user?.role !== 'admin') {
            console.warn("O*NET Import: Non-admin access attempt");
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        let body;
        try {
            body = await req.json();
            console.log("O*NET Import: Request body parsed", { action: body.action });
        } catch (parseError) {
            console.error("O*NET Import: Failed to parse JSON", parseError);
            return Response.json({
                error: 'Failed to parse request body',
                details: parseError.message
            }, { status: 400 });
        }

        const { action, profiles, entityName, records } = body;

        // Verify required entities exist before processing (except for 'get_counts')
        if (action !== 'get_counts') {
            console.log("O*NET Import: Checking entity configuration");

            const requiredEntities = [
                'ONetOccupation', 'ONetSkill', 'ONetAbility', 'ONetKnowledge',
                'ONetTask', 'ONetWorkActivity', 'ONetWorkContext', 'ONetReference'
            ];

            const missingEntities = [];
            const availableEntities = [];

            for (const ent of requiredEntities) {
                if (!base44.asServiceRole.entities[ent]) {
                    missingEntities.push(ent);
                } else {
                    availableEntities.push(ent);
                }
            }

            console.log("O*NET Import: Entity check complete", {
                available: availableEntities.length,
                missing: missingEntities.length,
                missingList: missingEntities
            });

            if (missingEntities.length > 0) {
                console.warn("O*NET Import: Missing entities detected", { missingEntities });
                return Response.json({
                    error: 'Missing O*NET entity schemas in Base44',
                    missingEntities,
                    totalMissing: missingEntities.length,
                    availableCount: availableEntities.length,
                    message: `${missingEntities.length} of ${requiredEntities.length} entities are not configured: ${missingEntities.join(', ')}`,
                    instructions: 'Create these entities in Base44 Settings → Schema. Each must be a Data Entity with API exposure enabled.',
                    availableEntities,
                    allRequiredEntities: requiredEntities
                }, { status: 412 });
            }

            console.log("O*NET Import: All entities verified");
        }

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
        console.error("O*NET Import Error:", {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
            details: JSON.stringify(error)
        });

        return Response.json({
            error: error?.message || "Import failed",
            errorType: error?.name,
            details: "Check server logs for details",
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
});

/**
 * Bulk import aggregated occupation profiles
 */
async function bulkImportProfiles(base44, profiles) {
    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
        return Response.json({ error: 'No profiles provided' }, { status: 400 });
    }

    const startTime = Date.now();
    const entity = base44.asServiceRole.entities.ONetOccupationProfile;

    if (!entity) {
        return Response.json({
            error: 'Entity schema "ONetOccupationProfile" not found in Base44 app',
            details: 'This entity needs to be created in Base44 Settings → Schema before importing data',
            hint: 'Create the ONetOccupationProfile entity in Base44 and ensure it is exposed in the API'
        }, { status: 404 });
    }

    const existing = await entity.list('-created_date', 2000);
    const existingSocCodes = new Set(existing.map((p) => p.soc_code));

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

    const BATCH_SIZE = 100;
    let importedCount = 0;
    const errors = [];

    for (let i = 0; i < newProfiles.length; i += BATCH_SIZE) {
        const batch = newProfiles.slice(i, i + BATCH_SIZE);
        try {
            await entity.bulkCreate(batch);
            importedCount += batch.length;
        } catch (e) {
            errors.push(`Batch ${i}-${i + batch.length}: ${e.message}`);
            for (const profile of batch) {
                try {
                    await entity.create(profile);
                    importedCount++;
                } catch (e2) {
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
            error_details: errors.slice(0, 10),
            duration_ms: Date.now() - startTime
        }
    });
}

/**
 * Bulk import raw records to a specific entity
 */
async function bulkImportRaw(base44, entityName, records) {
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

    if (!entity) {
        return Response.json({
            error: `Entity schema "${entityName}" not found in Base44 app`,
            details: 'This entity needs to be created in Base44 Settings → Schema before importing data',
            requiredEntities: validEntities,
            hint: 'Create the entity in Base44 and ensure it is exposed in the API'
        }, { status: 404 });
    }

    const BATCH_SIZE = 100;
    let importedCount = 0;
    const errors = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        try {
            await entity.bulkCreate(batch);
            importedCount += batch.length;
        } catch (e) {
            errors.push(`Batch ${i}: ${e.message}`);
            for (const record of batch) {
                try {
                    await entity.create(record);
                    importedCount++;
                } catch (e2) {
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
async function clearEntity(base44, entityName) {
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
async function getEntityCounts(base44) {
    const entities = [
        'ONetOccupation', 'ONetSkill', 'ONetAbility', 'ONetKnowledge',
        'ONetTask', 'ONetWorkActivity', 'ONetWorkContext', 'ONetReference',
        'ONetOccupationProfile'
    ];

    const counts = {};

    for (const entityName of entities) {
        try {
            const entity = base44.asServiceRole.entities[entityName];
            if (entity) {
                const records = await entity.list('-created_date', 10000);
                counts[entityName] = records.length;
            } else {
                counts[entityName] = -1;
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
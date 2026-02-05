/**
 * O*NET Import Debugging Utility
 * Provides detailed diagnostics for import failures
 */

export async function diagnoseONetSetup(base44) {
  console.log("=== O*NET Setup Diagnosis ===\n");

  const requiredEntities = [
    'ONetOccupation',
    'ONetSkill',
    'ONetAbility',
    'ONetKnowledge',
    'ONetTask',
    'ONetWorkActivity',
    'ONetWorkContext',
    'ONetReference'
  ];

  const diagnosis = {
    timestamp: new Date().toISOString(),
    entitiesChecked: [],
    allValid: true,
    recommendations: []
  };

  console.log(`Checking ${requiredEntities.length} entities...\n`);

  for (const entityName of requiredEntities) {
    const result = {
      name: entityName,
      exists: false,
      accessible: false,
      canCreate: false,
      error: null
    };

    try {
      // Check if entity exists
      const entity = base44.entities?.[entityName];

      if (!entity) {
        result.error = "Entity not found in base44.entities";
        console.error(`❌ ${entityName}: NOT FOUND`);
        console.error(`   Entity object is ${entity === undefined ? 'undefined' : entity === null ? 'null' : 'missing'}`);
        diagnosis.allValid = false;
      } else {
        result.exists = true;
        console.log(`✓ ${entityName}: Found`);

        // Try to check if we can access it
        try {
          const testList = await entity.list('-created_date', 1);
          result.accessible = true;
          console.log(`  ✓ Accessible (can query)`);
        } catch (listError) {
          console.warn(`  ⚠ Not accessible for query: ${listError.message}`);
          result.error = `Query error: ${listError.message}`;
        }

        // Check if we can create
        try {
          // Just checking if the method exists, not actually creating
          if (typeof entity.create === 'function') {
            result.canCreate = true;
            console.log(`  ✓ Can create records`);
          }
        } catch (createError) {
          console.warn(`  ⚠ Create method issue: ${createError.message}`);
          result.error = `Create error: ${createError.message}`;
        }
      }
    } catch (error) {
      result.error = error.message;
      console.error(`❌ ${entityName}: ERROR - ${error.message}`);
      diagnosis.allValid = false;
    }

    diagnosis.entitiesChecked.push(result);
  }

  // Summary and recommendations
  console.log("\n=== Summary ===");
  const foundCount = diagnosis.entitiesChecked.filter(e => e.exists).length;
  console.log(`Entities found: ${foundCount}/${requiredEntities.length}`);

  if (!diagnosis.allValid) {
    console.log("\n=== Recommendations ===");

    const missingEntities = diagnosis.entitiesChecked.filter(e => !e.exists);
    if (missingEntities.length > 0) {
      diagnosis.recommendations.push(
        `Create ${missingEntities.length} missing entities in Base44:`
      );
      missingEntities.forEach(e => {
        diagnosis.recommendations.push(`  - ${e.name}`);
      });
    }

    const inaccessibleEntities = diagnosis.entitiesChecked.filter(e => e.exists && !e.accessible);
    if (inaccessibleEntities.length > 0) {
      diagnosis.recommendations.push(
        `Check permissions for ${inaccessibleEntities.length} entities (not queryable):`
      );
      inaccessibleEntities.forEach(e => {
        diagnosis.recommendations.push(`  - ${e.name}: ${e.error}`);
      });
    }

    console.log(diagnosis.recommendations.join('\n'));
  } else {
    console.log("✓ All entities configured correctly!");
  }

  return diagnosis;
}

/**
 * Test a single entity with a test record
 */
export async function testEntityCreate(base44, entityName, testRecord = {}) {
  console.log(`\nTesting create on ${entityName}...`);

  try {
    const entity = base44.entities[entityName];

    if (!entity) {
      throw new Error(`Entity ${entityName} not found`);
    }

    if (!entity.create) {
      throw new Error(`Entity.create() method not available`);
    }

    // Create a minimal test record
    const record = testRecord || {
      test: `Test record at ${new Date().toISOString()}`
    };

    console.log(`Attempting to create record:`, record);
    const result = await entity.create(record);

    console.log(`✓ Successfully created test record:`, result);

    // Try to delete it
    try {
      if (result.id) {
        await entity.delete(result.id);
        console.log(`✓ Successfully deleted test record`);
      }
    } catch (deleteError) {
      console.warn(`Could not delete test record: ${deleteError.message}`);
    }

    return { success: true, result };
  } catch (error) {
    console.error(`❌ Create test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a diagnostic report
 */
export async function generateDiagnosticReport(base44) {
  const diagnosis = await diagnoseONetSetup(base44);

  const report = {
    timestamp: diagnosis.timestamp,
    summary: {
      totalEntities: diagnosis.entitiesChecked.length,
      foundEntities: diagnosis.entitiesChecked.filter(e => e.exists).length,
      accessibleEntities: diagnosis.entitiesChecked.filter(e => e.accessible).length,
      creatableEntities: diagnosis.entitiesChecked.filter(e => e.canCreate).length,
      allValid: diagnosis.allValid
    },
    entities: diagnosis.entitiesChecked,
    recommendations: diagnosis.recommendations,
    htmlReport: generateHTMLReport(diagnosis)
  };

  return report;
}

/**
 * Generate HTML diagnostic report
 */
function generateHTMLReport(diagnosis) {
  const entityRows = diagnosis.entitiesChecked.map(e => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 8px;">${e.name}</td>
      <td style="padding: 8px; text-align: center;">${e.exists ? '✓' : '✗'}</td>
      <td style="padding: 8px; text-align: center;">${e.accessible ? '✓' : e.exists ? '⚠' : '-'}</td>
      <td style="padding: 8px; text-align: center;">${e.canCreate ? '✓' : e.exists ? '⚠' : '-'}</td>
      <td style="padding: 8px; font-size: 12px; color: red;">${e.error || ''}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: monospace; padding: 16px; background: #f5f5f5; border-radius: 4px;">
      <h3>O*NET Setup Diagnostic Report</h3>
      <p>Generated: ${diagnosis.timestamp}</p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead style="background: #e0e0e0;">
          <tr>
            <th style="padding: 8px; text-align: left;">Entity</th>
            <th style="padding: 8px;">Exists</th>
            <th style="padding: 8px;">Accessible</th>
            <th style="padding: 8px;">Can Create</th>
            <th style="padding: 8px; text-align: left;">Error</th>
          </tr>
        </thead>
        <tbody>
          ${entityRows}
        </tbody>
      </table>

      <div style="margin-top: 16px; padding: 8px; background: ${diagnosis.allValid ? '#d4edda' : '#f8d7da'}; border-radius: 4px;">
        <strong>${diagnosis.allValid ? '✓ Setup Valid' : '✗ Setup Issues Detected'}</strong>
      </div>
    </div>
  `;
}

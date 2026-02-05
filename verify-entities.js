#!/usr/bin/env node

/**
 * Verify O*NET Entities - Check if they exist and have records
 */

import { createClient } from '@base44/sdk';

const ENTITIES = [
  'ONetOccupation',
  'ONetSkill',
  'ONetAbility',
  'ONetKnowledge',
  'ONetTask',
  'ONetWorkActivity',
  'ONetWorkContext',
  'ONetReference'
];

async function verifyEntities(apiKey, appId, serverUrl) {
  console.log('\n' + '='.repeat(70));
  console.log('O*NET Entities Verification');
  console.log('='.repeat(70));

  if (!apiKey || !appId || !serverUrl) {
    console.error('\nUsage: node verify-entities.js <API_KEY> <APP_ID> <SERVER_URL>\n');
    process.exit(1);
  }

  console.log(`\n📡 Server: ${serverUrl.split('//')[1]}`);
  console.log(`   App ID: ${appId}\n`);

  try {
    const client = createClient({
      appId,
      serverUrl,
      token: apiKey,
      requiresAuth: false
    });

    // Try to authenticate
    console.log('🔑 Authenticating...');
    const user = await client.auth.me();
    console.log(`✓ Authenticated\n`);

    // Check each entity
    console.log('🔍 Checking entities...\n');

    const results = [];

    for (const entityName of ENTITIES) {
      try {
        const entity = client.entities[entityName];

        if (!entity) {
          console.log(`✗ ${entityName.padEnd(25)} NOT FOUND (missing in SDK)`);
          results.push({ entity: entityName, exists: false });
          continue;
        }

        // Try to list records
        try {
          const records = await entity.list('-created_date', 1);
          console.log(`✓ ${entityName.padEnd(25)} EXISTS (ready for upload)`);
          results.push({ entity: entityName, exists: true, recordCount: records?.length || 0 });
        } catch (listError) {
          if (listError.message.includes('404') || listError.message.includes('not found')) {
            console.log(`✗ ${entityName.padEnd(25)} NOT FOUND (404)`);
            results.push({ entity: entityName, exists: false, error: 'Not found' });
          } else {
            console.log(`⚠ ${entityName.padEnd(25)} ERROR: ${listError.message.substring(0, 40)}`);
            results.push({ entity: entityName, exists: false, error: listError.message });
          }
        }
      } catch (error) {
        console.log(`✗ ${entityName.padEnd(25)} ERROR: ${error.message.substring(0, 40)}`);
        results.push({ entity: entityName, exists: false, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('Summary');
    console.log('='.repeat(70));

    const found = results.filter(r => r.exists).length;
    const missing = results.filter(r => !r.exists).length;

    console.log(`\n  ✓ Ready for upload: ${found}/${ENTITIES.length}`);
    console.log(`  ✗ Missing: ${missing}/${ENTITIES.length}`);

    if (found === ENTITIES.length) {
      console.log('\n✅ All entities are ready! You can now:\n');
      console.log('  1. Download O*NET CSV files from:');
      console.log('     https://www.onetcenter.org/database.html#individual-files\n');
      console.log('  2. Go to the O*NET Import page in your app\n');
      console.log('  3. Upload and import the CSV files\n');
      return true;
    } else if (found > 0) {
      console.log(`\n⏳ Partial: ${found} entities ready, ${missing} still missing\n`);
      console.log('Missing:');
      results.filter(r => !r.exists).forEach(r => {
        console.log(`  • ${r.entity}`);
      });
      console.log('');
      return false;
    } else {
      console.log('\n❌ No entities found. Contact Base44 support to create them.\n');
      return false;
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('Authentication failed. Check your API key.\n');
    }
    return false;
  }
}

// Run
const [, , apiKey, appId, serverUrl] = process.argv;
const success = await verifyEntities(apiKey, appId, serverUrl);
process.exit(success ? 0 : 1);

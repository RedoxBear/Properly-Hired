#!/usr/bin/env node

/**
 * O*NET Entities Setup Script
 *
 * Creates 8 required O*NET entity schemas in Base44 using the API
 *
 * Usage:
 *   node setup-onet-entities.js <API_KEY> <APP_ID> <SERVER_URL>
 *
 * Example:
 *   node setup-onet-entities.js your_api_key_here app_68af4e866eafaf5bc320af8a https://preview-sandbox--xxxxx.base44.app
 */

const https = require('https');
const { createClient } = require('@base44/sdk');

// Entity definitions
const ENTITIES = [
  {
    name: 'ONetOccupation',
    displayName: 'O*NET Occupation',
    description: 'Occupations with SOC codes, titles, descriptions, and job zones'
  },
  {
    name: 'ONetSkill',
    displayName: 'O*NET Skill',
    description: 'Skills data including importance and level ratings'
  },
  {
    name: 'ONetAbility',
    displayName: 'O*NET Ability',
    description: 'Abilities data including importance and level ratings'
  },
  {
    name: 'ONetKnowledge',
    displayName: 'O*NET Knowledge',
    description: 'Knowledge areas required for occupations'
  },
  {
    name: 'ONetTask',
    displayName: 'O*NET Task',
    description: 'Task statements and ratings for occupations'
  },
  {
    name: 'ONetWorkActivity',
    displayName: 'O*NET Work Activity',
    description: 'Work activities including IWA and DWA references'
  },
  {
    name: 'ONetWorkContext',
    displayName: 'O*NET Work Context',
    description: 'Work context and environment information'
  },
  {
    name: 'ONetReference',
    displayName: 'O*NET Reference',
    description: 'Reference tables for scales, content model, job zones, etc.'
  }
];

async function createEntity(client, entityName) {
  const entity = ENTITIES.find(e => e.name === entityName);
  if (!entity) {
    throw new Error(`Entity definition not found: ${entityName}`);
  }

  try {
    console.log(`\n📝 Creating entity: ${entityName}...`);

    // Check if entity already exists
    const existingEntity = client.entities[entityName];
    if (existingEntity) {
      console.log(`✓ Entity already exists: ${entityName}`);
      return { success: true, action: 'exists', entity: entityName };
    }

    // Create entity via API
    const response = await client.asServiceRole.entities.create({
      name: entityName,
      displayName: entity.displayName,
      description: entity.description,
      type: 'data'
    }).catch(err => {
      // Entity creation might not be directly available via SDK
      // In that case, we provide instructions
      throw new Error(`Cannot create entity via SDK. ${err.message}`);
    });

    console.log(`✓ Successfully created: ${entityName}`);
    return { success: true, action: 'created', entity: entityName };

  } catch (error) {
    console.error(`✗ Error with ${entityName}: ${error.message}`);
    return { success: false, action: 'error', entity: entityName, error: error.message };
  }
}

async function setupONetEntities(apiKey, appId, serverUrl) {
  console.log('\n' + '='.repeat(60));
  console.log('O*NET Entities Setup Script');
  console.log('='.repeat(60));

  try {
    // Validate inputs
    if (!apiKey || !appId || !serverUrl) {
      console.error('\n❌ Error: Missing required parameters');
      console.error('\nUsage: node setup-onet-entities.js <API_KEY> <APP_ID> <SERVER_URL>');
      console.error('\nExample:');
      console.error('  node setup-onet-entities.js sk_live_abc123... app_68af4e... https://preview-sandbox--xxx.base44.app');
      process.exit(1);
    }

    console.log(`\n📡 Connecting to Base44...`);
    console.log(`   App ID: ${appId}`);
    console.log(`   Server: ${serverUrl}`);

    // Create Base44 client
    const client = createClient({
      appId,
      serverUrl,
      token: apiKey,
      requiresAuth: false
    });

    // Verify authentication
    try {
      const user = await client.auth.me();
      console.log(`✓ Authenticated as: ${user.email || 'Admin'}`);
    } catch (e) {
      console.error(`✗ Authentication failed: ${e.message}`);
      console.error('Please verify your API key is correct');
      process.exit(1);
    }

    // Check existing entities
    console.log('\n🔍 Checking existing entities...');
    const existing = ENTITIES.filter(e => client.entities[e.name]);
    const missing = ENTITIES.filter(e => !client.entities[e.name]);

    if (existing.length > 0) {
      console.log(`\n✓ Already created (${existing.length}):`);
      existing.forEach(e => console.log(`  • ${e.name}`));
    }

    if (missing.length === 0) {
      console.log('\n✓ All entities already exist! Setup is complete.');
      return { success: true, message: 'All entities already created' };
    }

    console.log(`\n⚠ Missing entities (${missing.length}):`);
    missing.forEach(e => console.log(`  • ${e.name}`));

    // Attempt to create missing entities
    console.log('\n📦 Creating missing entities...');
    const results = [];
    for (const entity of missing) {
      const result = await createEntity(client, entity.name);
      results.push(result);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Setup Summary');
    console.log('='.repeat(60));

    const created = results.filter(r => r.action === 'created').length;
    const errors = results.filter(r => r.action === 'error');

    console.log(`\n✓ Already existed: ${existing.length}`);
    console.log(`✓ Successfully created: ${created}`);
    console.log(`✗ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(e => console.log(`  • ${e.entity}: ${e.error}`));
    }

    console.log('\n' + '='.repeat(60));

    if (errors.length > 0) {
      console.log('\n⚠️ Manual Setup Required:');
      console.log('\nIf you cannot create entities via this script, you can create them');
      console.log('manually in the Base44 dashboard:');
      console.log('\n1. Go to your Base44 application');
      console.log('2. Navigate to: Settings → Schema/Entities');
      console.log('3. Create these entities:');
      ENTITIES.forEach(e => {
        if (!existing.find(ex => ex.name === e.name)) {
          console.log(`   • ${e.name}`);
        }
      });
      console.log('\n4. For each entity:');
      console.log('   - Set as "Data Entity"');
      console.log('   - Enable "Expose in API"');
      console.log('   - Save');
    }

    if (existing.length + created === ENTITIES.length) {
      console.log('\n✅ All entities are now ready for O*NET import!\n');
      return { success: true, message: 'Setup complete' };
    } else {
      console.log('\n❌ Setup incomplete. Please follow manual setup instructions above.\n');
      return { success: false, message: 'Setup incomplete' };
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
const [, , apiKey, appId, serverUrl] = process.argv;
setupONetEntities(apiKey, appId, serverUrl);

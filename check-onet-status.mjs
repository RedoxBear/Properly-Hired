#!/usr/bin/env node
/**
 * O*NET Upload Status Checker
 * Checks the status of O*NET entities in Base44
 */

import axios from 'axios';

const BASE44_API_KEY = 'daadd83830f1405a9ed3b8e030da05b4';
const BASE44_APP_ID = '68af4e866eafaf5bc320af8a';
const BASE44_API_URL = 'https://base44.app/api';

const entities = [
  'ONetOccupation',
  'ONetSkill',
  'ONetAbility',
  'ONetKnowledge',
  'ONetTask',
  'ONetWorkActivity',
  'ONetWorkContext',
  'ONetReference'
];

const expectedCounts = {
  'ONetOccupation': 1017,
  'ONetSkill': 62581,
  'ONetAbility': 92977,
  'ONetKnowledge': 59005,
  'ONetTask': 18797,
  'ONetWorkActivity': 73309,
  'ONetWorkContext': 297677,
  'ONetReference': 631
};

async function checkEntityStatus(entityName) {
  try {
    const url = `${BASE44_API_URL}/apps/${BASE44_APP_ID}/entities/${entityName}`;
    const response = await axios.get(url, {
      headers: {
        'api_key': BASE44_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        limit: 1
      }
    });

    // Try to get total count
    const count = response.data?.length || 0;
    const expected = expectedCounts[entityName] || 0;
    const percentage = expected > 0 ? ((count / expected) * 100).toFixed(1) : 0;

    return {
      entity: entityName,
      current: count,
      expected: expected,
      percentage: percentage,
      status: count > 0 ? '✅ Has Data' : '❌ Empty'
    };
  } catch (error) {
    return {
      entity: entityName,
      current: 0,
      expected: expectedCounts[entityName] || 0,
      percentage: 0,
      status: '❌ Error: ' + (error.response?.status || error.message),
      error: error.response?.data?.message || error.message
    };
  }
}

async function main() {
  console.log('\n📊 O*NET Upload Status Report\n');
  console.log('=' .repeat(80));

  const results = [];

  for (const entity of entities) {
    const status = await checkEntityStatus(entity);
    results.push(status);

    const bar = '█'.repeat(Math.floor(status.percentage / 5));
    const empty = '░'.repeat(20 - Math.floor(status.percentage / 5));

    console.log(`\n${status.entity}`);
    console.log(`  Status: ${status.status}`);
    console.log(`  Count: ${status.current.toLocaleString()} / ${status.expected.toLocaleString()} (${status.percentage}%)`);
    console.log(`  [${bar}${empty}] ${status.percentage}%`);
    if (status.error) {
      console.log(`  Error: ${status.error}`);
    }
  }

  console.log('\n' + '='.repeat(80));

  const totalCurrent = results.reduce((sum, r) => sum + r.current, 0);
  const totalExpected = results.reduce((sum, r) => sum + r.expected, 0);
  const overallPercentage = ((totalCurrent / totalExpected) * 100).toFixed(1);

  console.log(`\nOverall Progress: ${totalCurrent.toLocaleString()} / ${totalExpected.toLocaleString()} records (${overallPercentage}%)`);

  const hasData = results.filter(r => r.current > 0).length;
  const isEmpty = results.filter(r => r.current === 0).length;

  console.log(`\nSummary:`);
  console.log(`  ✅ Entities with data: ${hasData}/8`);
  console.log(`  ❌ Empty entities: ${isEmpty}/8`);

  if (totalCurrent === 0) {
    console.log(`\n⚠️  No O*NET data found in Base44!`);
    console.log(`\nNext Steps:`);
    console.log(`  1. Fix entity schemas (see FIX_ONET_SCHEMA_MISMATCH.md)`);
    console.log(`  2. Deploy queryONetAPI function (see DEPLOY_ONET_FUNCTIONS.md)`);
    console.log(`  3. Upload data via /ONetImport page`);
  } else if (overallPercentage < 100) {
    console.log(`\n⏳ Import in progress or incomplete (${overallPercentage}% complete)`);
  } else {
    console.log(`\n✅ All O*NET data successfully imported!`);
  }

  console.log('');
}

main().catch(error => {
  console.error('Error checking status:', error.message);
  process.exit(1);
});

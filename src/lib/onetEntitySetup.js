/**
 * O*NET Entity Setup Utility
 * Initializes and verifies O*NET entity schemas in Base44
 */

const ONET_ENTITY_DEFINITIONS = {
  ONetOccupation: {
    displayName: "O*NET Occupation",
    description: "Occupations with SOC codes, titles, descriptions, and zones",
    keyFields: ["soc_code"]
  },
  ONetSkill: {
    displayName: "O*NET Skill",
    description: "Skills data including importance and level ratings",
    keyFields: ["element_id"]
  },
  ONetAbility: {
    displayName: "O*NET Ability",
    description: "Abilities data including importance and level ratings",
    keyFields: ["element_id"]
  },
  ONetKnowledge: {
    displayName: "O*NET Knowledge",
    description: "Knowledge areas required for occupations",
    keyFields: ["element_id"]
  },
  ONetTask: {
    displayName: "O*NET Task",
    description: "Task statements and ratings for occupations",
    keyFields: ["task_id"]
  },
  ONetWorkActivity: {
    displayName: "O*NET Work Activity",
    description: "Work activities including IWA and DWA references",
    keyFields: ["element_id"]
  },
  ONetWorkContext: {
    displayName: "O*NET Work Context",
    description: "Work context and environment information",
    keyFields: ["element_id"]
  },
  ONetReference: {
    displayName: "O*NET Reference",
    description: "Reference tables for scales, content model, job zones, etc.",
    keyFields: ["element_id"]
  }
};

/**
 * Check if all required O*NET entities exist in Base44
 * @param {Object} base44 - Base44 client instance
 * @returns {Object} - { valid: boolean, missingEntities: string[], message: string }
 */
export async function verifyONetEntities(base44) {
  const requiredEntities = Object.keys(ONET_ENTITY_DEFINITIONS);
  const missingEntities = [];
  const presentEntities = [];

  for (const entityName of requiredEntities) {
    const entity = base44.entities?.[entityName];
    if (!entity) {
      missingEntities.push(entityName);
    } else {
      presentEntities.push(entityName);
    }
  }

  const allExist = missingEntities.length === 0;

  return {
    valid: allExist,
    missingEntities,
    presentEntities,
    total: requiredEntities.length,
    present: presentEntities.length,
    message: allExist
      ? `All ${requiredEntities.length} O*NET entities are ready.`
      : `Missing ${missingEntities.length} of ${requiredEntities.length} O*NET entities.`
  };
}

/**
 * Generate setup instructions for creating O*NET entities
 * @returns {string} - HTML-formatted setup instructions
 */
export function getONetSetupInstructions() {
  const entities = Object.entries(ONET_ENTITY_DEFINITIONS);

  return `
# O*NET Entity Setup Required

The following 8 entities need to be created in your Base44 application before you can import O*NET data:

${entities.map(([name, def]) => `
## ${name}
- **Display Name:** ${def.displayName}
- **Description:** ${def.description}
- **Key Field:** ${def.keyFields.join(", ")}
`).join("")}

## Steps to Create Entities:

1. **Navigate to Base44 App Settings**
   - Open your Base44 application
   - Go to Settings → Entities or Schema

2. **Create Each Entity**
   For each of the 8 entities listed above:
   - Click "Create New Entity"
   - Enter the entity name (e.g., "ONetOccupation")
   - Set it as a Data Entity
   - Add at least these fields:
     - A primary key/ID field
     - For ONetOccupation: soc_code, title, description
     - For skills/abilities/knowledge/work_activity/work_context: element_id, name, description
     - For ONetTask: task_id, statement
     - For ONetReference: element_id, element_name, type

3. **Enable API Access**
   - Ensure all 8 entities are exposed in the Base44 API
   - Check permissions to allow authenticated users to create/read/update

4. **Return to O*NET Import**
   - Refresh this page
   - The import should now be available

## Alternative: Contact Support
If you need help creating these entities, please provide this list to your Base44 administrator or support team.
`;
}

/**
 * Get detailed setup information for admin
 */
export function getONetSetupDetails() {
  return {
    requiredEntities: ONET_ENTITY_DEFINITIONS,
    totalRecordsToImport: {
      ONetOccupation: "~60,000",
      ONetSkill: "~62,000",
      ONetAbility: "~90,000",
      ONetKnowledge: "~60,000",
      ONetTask: "~160,000",
      ONetWorkActivity: "~73,000",
      ONetWorkContext: "~298,000",
      ONetReference: "~1,100,000"
    },
    totalDataSize: "~1,900,000 records across 40 CSV files"
  };
}

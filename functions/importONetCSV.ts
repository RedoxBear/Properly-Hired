import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * O*NET 30.1 CSV Import — server-side
 *
 * Actions:
 *   import_csv   – fetch a CSV from file_url, parse, map to entity, bulkCreate
 *   get_counts   – return record counts for all O*NET entities
 *   clear_entity – delete all records from a single entity
 */

// ── CSV column → entity field mappings ──────────────────────────
const ENTITY_MAP = {
  // ─── ONetOccupation ───
  "Occupation_Data.csv":        { entity: "ONetOccupation", mapper: mapOccupation },
  "Alternate_Titles.csv":       { entity: "ONetOccupation", mapper: mapAlternateTitle },
  "Job_Zones.csv":              { entity: "ONetOccupation", mapper: mapJobZone },

  // ─── ONetSkill ───
  "Skills.csv":                 { entity: "ONetSkill", mapper: mapRatedElement("skill") },

  // ─── ONetAbility ───
  "Abilities.csv":              { entity: "ONetAbility", mapper: mapRatedElement("ability") },

  // ─── ONetKnowledge ───
  "Knowledge.csv":              { entity: "ONetKnowledge", mapper: mapRatedElement("knowledge") },

  // ─── ONetTask ───
  "Task_Statements.csv":        { entity: "ONetTask", mapper: mapTaskStatement },
  "Emerging_Tasks.csv":         { entity: "ONetTask", mapper: mapEmergingTask },

  // ─── ONetWorkActivity ───
  "Work_Activities.csv":        { entity: "ONetWorkActivity", mapper: mapRatedElement("activity") },

  // ─── ONetWorkContext ───
  "Work_Context.csv":           { entity: "ONetWorkContext", mapper: mapWorkContext },

  // ─── ONetReference (catch-all for reference / cross-walk tables) ───
  "Content_Model_Reference.csv":                    { entity: "ONetReference", mapper: mapContentModelRef },
  "Scales_Reference.csv":                           { entity: "ONetReference", mapper: mapScalesRef },
  "DWA_Reference.csv":                              { entity: "ONetReference", mapper: mapGenericRef("DWA_Reference") },
  "IWA_Reference.csv":                              { entity: "ONetReference", mapper: mapGenericRef("IWA_Reference") },
  "Job_Zone_Reference.csv":                         { entity: "ONetReference", mapper: mapGenericRef("Job_Zone_Reference") },
  "Education_Training_and_Experience.csv":           { entity: "ONetReference", mapper: mapGenericRef("Education_Training") },
  "Education_Training_and_Experience_Categories.csv":{ entity: "ONetReference", mapper: mapGenericRef("Education_Categories") },
  "Interests.csv":                                  { entity: "ONetReference", mapper: mapGenericRef("Interests") },
  "Work_Styles.csv":                                { entity: "ONetReference", mapper: mapGenericRef("Work_Styles") },
  "Work_Values.csv":                                { entity: "ONetReference", mapper: mapGenericRef("Work_Values") },
  "Technology_Skills.csv":                          { entity: "ONetReference", mapper: mapGenericRef("Technology_Skills") },
  "Tools_Used.csv":                                 { entity: "ONetReference", mapper: mapGenericRef("Tools_Used") },
  "Related_Occupations.csv":                        { entity: "ONetReference", mapper: mapGenericRef("Related_Occupations") },
  "Sample_of_Reported_Titles.csv":                  { entity: "ONetReference", mapper: mapGenericRef("Reported_Titles") },
  "UNSPSC_Reference.csv":                           { entity: "ONetReference", mapper: mapGenericRef("UNSPSC") },
  "Abilities_to_Work_Activities.csv":               { entity: "ONetReference", mapper: mapGenericRef("Abilities_to_WA") },
  "Abilities_to_Work_Context.csv":                  { entity: "ONetReference", mapper: mapGenericRef("Abilities_to_WC") },
  "Skills_to_Work_Activities.csv":                  { entity: "ONetReference", mapper: mapGenericRef("Skills_to_WA") },
  "Skills_to_Work_Context.csv":                     { entity: "ONetReference", mapper: mapGenericRef("Skills_to_WC") },
  "Tasks_to_DWAs.csv":                              { entity: "ONetReference", mapper: mapGenericRef("Tasks_to_DWAs") },
  "Task_Ratings.csv":                               { entity: "ONetReference", mapper: mapGenericRef("Task_Ratings") },
  "Task_Categories.csv":                            { entity: "ONetReference", mapper: mapGenericRef("Task_Categories") },
  "Level_Scale_Anchors.csv":                        { entity: "ONetReference", mapper: mapGenericRef("Level_Scale_Anchors") },
  "Occupation_Level_Metadata.csv":                  { entity: "ONetReference", mapper: mapGenericRef("Occupation_Metadata") },
  "Survey_Booklet_Locations.csv":                   { entity: "ONetReference", mapper: mapGenericRef("Survey_Booklet") },
  "Work_Context_Categories.csv":                    { entity: "ONetReference", mapper: mapGenericRef("Work_Context_Categories") },
  "Basic_Interests_to_RIASEC.csv":                  { entity: "ONetReference", mapper: mapGenericRef("Interests_RIASEC") },
  "RIASEC_Keywords.csv":                            { entity: "ONetReference", mapper: mapGenericRef("RIASEC_Keywords") },
  "Interests_Illustrative_Activities.csv":          { entity: "ONetReference", mapper: mapGenericRef("Interests_Activities") },
  "Interests_Illustrative_Occupations.csv":         { entity: "ONetReference", mapper: mapGenericRef("Interests_Occupations") },
};

// ── Mappers ─────────────────────────────────────────────────────

function mapOccupation(row) {
  return {
    code: row["O*NET-SOC Code"] || "",
    title: row["Title"] || "",
    description: row["Description"] || "",
    tags: [row["Title"]].filter(Boolean),
  };
}

function mapAlternateTitle(row) {
  return {
    code: row["O*NET-SOC Code"] || "",
    title: row["Title"] || "",
    description: `Alternate: ${row["Alternate Title"] || ""}`,
    tags: [row["Alternate Title"], row["Short Title"]].filter(Boolean),
  };
}

function mapJobZone(row) {
  return {
    code: row["O*NET-SOC Code"] || "",
    title: row["Title"] || "",
    job_zone: parseFloat(row["Job Zone"]) || 0,
    tags: [`Job Zone ${row["Job Zone"]}`],
  };
}

function mapRatedElement(type) {
  const categoryMap = {
    skill:     { nameField: "skill_name",    catField: "skill_category" },
    ability:   { nameField: "ability_name",  catField: "ability_category" },
    knowledge: { nameField: "knowledge_name", catField: "knowledge_category" },
    activity:  { nameField: "activity_name", catField: "activity_category" },
  };
  const { nameField, catField } = categoryMap[type];

  return (row) => {
    const scaleId = row["Scale ID"] || "";
    const importance = scaleId === "IM" ? parseFloat(row["Data Value"]) || 0 : 0;
    const level     = scaleId === "LV" ? parseFloat(row["Data Value"]) || 0 : 0;
    return {
      occupation_code:  row["O*NET-SOC Code"] || "",
      occupation_title: row["Title"] || "",
      [nameField]:      row["Element Name"] || "",
      [catField]:       row["Element ID"]?.split(".").slice(0, 2).join(".") || "",
      importance,
      level,
      description:      `${row["Element Name"]} (${scaleId}: ${row["Data Value"]})`,
      keywords:         [row["Element Name"], row["Title"]].filter(Boolean),
    };
  };
}

function mapTaskStatement(row) {
  return {
    occupation_code:  row["O*NET-SOC Code"] || "",
    occupation_title: row["Title"] || "",
    task_name:        row["Task"] || "",
    task_type:        row["Task Type"] || "Core",
    description:      row["Task"] || "",
    keywords:         [row["Title"]].filter(Boolean),
  };
}

function mapEmergingTask(row) {
  return {
    occupation_code:  row["O*NET-SOC Code"] || "",
    occupation_title: row["Title"] || "",
    task_name:        row["Task"] || "",
    task_type:        row["Category"] === "New" ? "Supplemental" : "Core",
    description:      `${row["Category"]}: ${row["Task"]}`,
    keywords:         [row["Title"], "emerging"].filter(Boolean),
  };
}

function mapWorkContext(row) {
  return {
    occupation_code:  row["O*NET-SOC Code"] || "",
    occupation_title: row["Title"] || "",
    context_name:     row["Element Name"] || "",
    context_category: row["Element ID"]?.split(".").slice(0, 3).join(".") || "",
    value:            parseFloat(row["Data Value"]) || 0,
    description:      `${row["Element Name"]} (${row["Scale ID"]}: ${row["Data Value"]})`,
    keywords:         [row["Element Name"], row["Title"]].filter(Boolean),
  };
}

function mapContentModelRef(row) {
  return {
    reference_type: "occupation",
    reference_key:  row["Element ID"] || "",
    reference_name: row["Element Name"] || "",
    version:        "30.1",
    import_date:    new Date().toISOString(),
    status:         "completed",
    notes:          row["Description"] || "",
  };
}

function mapScalesRef(row) {
  return {
    reference_type: "skill",
    reference_key:  row["Scale ID"] || "",
    reference_name: row["Scale Name"] || "",
    version:        "30.1",
    import_date:    new Date().toISOString(),
    status:         "completed",
    metadata:       { minimum: row["Minimum"], maximum: row["Maximum"] },
  };
}

function mapGenericRef(refType) {
  return (row) => {
    const cols = Object.keys(row);
    const key  = row[cols[0]] || "";
    const name = row[cols[1]] || row[cols[0]] || "";
    return {
      reference_type: "import_batch",
      reference_key:  `${refType}::${key}`,
      reference_name: name.substring(0, 200),
      version:        "30.1",
      import_date:    new Date().toISOString(),
      status:         "completed",
      notes:          refType,
      metadata:       row,
    };
  };
}

// ── CSV Parser (handles quoted fields, newlines in quotes) ──────

function parseCSV(text) {
  const lines = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "\n" && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = "";
    } else if (ch === "\r" && !inQuotes) {
      // skip
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return [];

  const header = splitCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length !== header.length) continue;
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = values[j];
    }
    rows.push(obj);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Resolve a CSV filename from a potentially split upload name ──

function resolveCSVName(uploadName) {
  // Strip part suffixes: "Abilities__part001.csv" → "Abilities.csv"
  const base = uploadName.replace(/__part\d+\.csv$/i, ".csv");
  if (ENTITY_MAP[base]) return base;

  // Try exact match
  if (ENTITY_MAP[uploadName]) return uploadName;

  // Fuzzy: strip leading hash prefix from Base44 uploads
  const cleaned = uploadName.replace(/^[a-f0-9]+_/, "");
  if (ENTITY_MAP[cleaned]) return cleaned;
  const cleanedBase = cleaned.replace(/__part\d+\.csv$/i, ".csv");
  if (ENTITY_MAP[cleanedBase]) return cleanedBase;

  return null;
}

// ── Main handler ────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "import_csv": {
        const { file_url, csv_name } = body;
        if (!file_url || !csv_name) {
          return Response.json({ error: "file_url and csv_name required" }, { status: 400 });
        }

        const resolvedName = resolveCSVName(csv_name);
        if (!resolvedName) {
          return Response.json({ error: `Unknown CSV: ${csv_name}`, known_files: Object.keys(ENTITY_MAP) }, { status: 400 });
        }

        const mapping = ENTITY_MAP[resolvedName];
        const entity = base44.asServiceRole.entities[mapping.entity];
        if (!entity) {
          return Response.json({ error: `Entity ${mapping.entity} not found` }, { status: 404 });
        }

        // Fetch CSV
        console.log(`Fetching CSV: ${csv_name} → ${resolvedName} → ${mapping.entity}`);
        const resp = await fetch(file_url);
        if (!resp.ok) {
          return Response.json({ error: `Failed to fetch file: ${resp.status}` }, { status: 502 });
        }
        const text = await resp.text();

        // Parse
        const rows = parseCSV(text);
        console.log(`Parsed ${rows.length} rows from ${csv_name}`);

        if (rows.length === 0) {
          return Response.json({ success: true, stats: { entity: mapping.entity, provided: 0, imported: 0, errors: 0 } });
        }

        // Map rows
        const mapped = [];
        for (const row of rows) {
          try {
            mapped.push(mapping.mapper(row));
          } catch (e) {
            // skip bad rows
          }
        }

        // Check if caller wants chunked mode (for large files)
        const chunkStart = body.chunk_start || 0;
        const chunkSize = body.chunk_size || 5000; // process 5000 rows per call
        const isChunked = mapped.length > chunkSize;
        
        const sliceEnd = Math.min(chunkStart + chunkSize, mapped.length);
        const chunk = isChunked ? mapped.slice(chunkStart, sliceEnd) : mapped;

        // BulkCreate in batches of 500
        const BATCH = 500;
        let imported = 0;
        let errors = 0;

        for (let i = 0; i < chunk.length; i += BATCH) {
          const batch = chunk.slice(i, i + BATCH);
          try {
            await entity.bulkCreate(batch);
            imported += batch.length;
          } catch (e) {
            // Fallback: smaller batches of 50
            for (let j = 0; j < batch.length; j += 50) {
              const smallBatch = batch.slice(j, j + 50);
              try {
                await entity.bulkCreate(smallBatch);
                imported += smallBatch.length;
              } catch (_) {
                errors += smallBatch.length;
              }
            }
          }
        }

        const hasMore = isChunked && sliceEnd < mapped.length;
        console.log(`Import chunk done: ${imported} imported, ${errors} errors for ${csv_name} (rows ${chunkStart}-${sliceEnd} of ${mapped.length})`);

        return Response.json({
          success: true,
          stats: {
            entity: mapping.entity,
            csv_name: resolvedName,
            provided: mapped.length,
            imported,
            errors,
            has_more: hasMore,
            next_chunk_start: hasMore ? sliceEnd : null,
            total_rows: mapped.length,
          },
        });
      }

      case "get_counts": {
        const entities = [
          "ONetOccupation", "ONetSkill", "ONetAbility", "ONetKnowledge",
          "ONetTask", "ONetWorkActivity", "ONetWorkContext", "ONetReference",
        ];
        const counts = {};
        for (const name of entities) {
          try {
            const ent = base44.asServiceRole.entities[name];
            if (ent) {
              const recs = await ent.list("-created_date", 1);
              // Use list with limit 1 just to check; real count needs filter
              counts[name] = recs.length > 0 ? ">0" : 0;
            } else {
              counts[name] = -1;
            }
          } catch (_) {
            counts[name] = -1;
          }
        }
        return Response.json({ success: true, counts });
      }

      case "resolve_files": {
        const { file_names } = body;
        if (!file_names || !Array.isArray(file_names)) {
          return Response.json({ error: "file_names array required" }, { status: 400 });
        }
        const results = file_names.map((name) => {
          const resolved = resolveCSVName(name);
          return {
            upload_name: name,
            resolved_name: resolved,
            entity: resolved ? ENTITY_MAP[resolved].entity : null,
            supported: !!resolved,
          };
        });
        return Response.json({ success: true, files: results });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("importONetCSV error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EDU_LABELS = {
  1: "Less than High School",
  2: "High School Diploma/GED",
  3: "Post-Secondary Certificate",
  4: "Some College",
  5: "Associate's Degree",
  6: "Bachelor's Degree",
  7: "Post-Baccalaureate Certificate",
  8: "Master's Degree",
  9: "Post-Master's Certificate",
  10: "Professional Degree",
  11: "Doctoral Degree",
  12: "Post-Doctoral Training",
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchAll(entity, sortField = "created_date") {
  const results = [];
  let offset = 0;
  const PAGE = 500;
  while (true) {
    const page = await entity.list(sortField, PAGE, offset);
    if (!page || page.length === 0) break;
    results.push(...page);
    if (page.length < PAGE) break;
    offset += PAGE;
    await sleep(200);
  }
  return results;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action = "build" } = await req.json().catch(() => ({}));

    if (action === "build") {
      // Step 1: Load all occupations
      const occupations = await fetchAll(base44.asServiceRole.entities.ONetOccupation);

      const profiles = {};
      for (const occ of occupations) {
        const soc = occ.code || occ.onet_soc_code;
        if (!soc) continue;
        profiles[soc] = {
          onet_soc_code: soc,
          title: occ.title || "",
          description: occ.description || "",
          job_zone: occ.job_zone || 0,
          skills: new Set(),
          knowledge: new Set(),
          abilities: new Set(),
          work_activities: new Set(),
          work_styles: new Set(),
          tasks: new Set(),
          emerging_tasks: new Set(),
          tech: new Set(),
          alternate_titles: new Set(),
          related_socs: [],
          _wv_scores: {},
          _riasec_scores: {},
          _edu_scores: {},
        };
      }

      console.log(`Loaded ${Object.keys(profiles).length} occupation stubs`);

      // Step 2: Load rated elements
      const loadRated = async (entityName, nameField, setKey) => {
        const rows = await fetchAll(base44.asServiceRole.entities[entityName]);
        let count = 0;
        for (const row of rows) {
          const soc = row.occupation_code || row.onet_soc_code;
          const name = row[nameField];
          if (!soc || !name || !profiles[soc]) continue;
          profiles[soc][setKey].add(name);
          count++;
        }
        console.log(`${entityName}: ${rows.length} rows, ${count} mapped`);
      };

      await loadRated("ONetSkill", "skill_name", "skills");
      await loadRated("ONetKnowledge", "knowledge_name", "knowledge");
      await loadRated("ONetAbility", "ability_name", "abilities");
      await loadRated("ONetWorkActivity", "activity_name", "work_activities");

      // Step 3: Load tasks
      const tasks = await fetchAll(base44.asServiceRole.entities.ONetTask);
      for (const row of tasks) {
        const soc = row.occupation_code || row.onet_soc_code;
        if (!soc || !profiles[soc]) continue;
        const text = row.task_name || "";
        if (!text) continue;
        const taskType = (row.task_type || "").toLowerCase();
        if (taskType === "supplemental" || (row.description || "").toLowerCase().startsWith("new:")) {
          profiles[soc].emerging_tasks.add(text);
        } else {
          profiles[soc].tasks.add(text);
        }
      }
      console.log(`Tasks: ${tasks.length} rows loaded`);

      // Step 4: Load ONetReference scored elements
      const refs = await fetchAll(base44.asServiceRole.entities.ONetReference);
      console.log(`ONetReference: ${refs.length} rows loaded`);

      for (const row of refs) {
        const refType = row.notes || "";
        const meta = row.metadata || {};
        const soc = meta.onet_soc_code;
        if (!soc || !profiles[soc]) continue;

        if (refType === "Work_Styles") {
          const name = meta.element_name || "";
          if (name) profiles[soc].work_styles.add(name);
        } else if (refType === "Work_Values") {
          const name = meta.element_name || "";
          const val = parseFloat(meta.data_value) || 0;
          if (name && val > (profiles[soc]._wv_scores[name] ?? -1)) {
            profiles[soc]._wv_scores[name] = val;
          }
        } else if (refType === "Interests") {
          const name = meta.element_name || "";
          const val = parseFloat(meta.data_value) || 0;
          if (name && val > (profiles[soc]._riasec_scores[name] ?? -1)) {
            profiles[soc]._riasec_scores[name] = val;
          }
        } else if (refType === "Education_Training") {
          const cat = parseInt(meta.education_category) || 0;
          const val = parseFloat(meta.data_value) || 0;
          if (cat && val > (profiles[soc]._edu_scores[cat] ?? -1)) {
            profiles[soc]._edu_scores[cat] = val;
          }
        } else if (refType === "Reported_Titles") {
          const title = row.reference_name || meta.alternate_title || meta.title || "";
          if (title) profiles[soc].alternate_titles.add(title);
        } else if (refType === "Related_Occupations") {
          const related = meta["Related O*NET-SOC Code"] || "";
          const tier = meta["Relatedness Tier"] || "";
          if (related && tier === "Primary-Short" && !profiles[soc].related_socs.includes(related)) {
            profiles[soc].related_socs.push(related);
          }
        } else if (refType === "Technology_Skills") {
          const name = meta["Example"] || meta["Commodity Title"] || row.reference_name || "";
          if (name) profiles[soc].tech.add(name);
        } else if (refType === "Tools_Used") {
          const name = meta["Commodity Title"] || row.reference_name || "";
          if (name) profiles[soc].tech.add(name);
        }
      }

      // Step 5: Compile
      const topN = (scores, n = 3) =>
        Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, n)
          .map(([name]) => name);

      const compiled = Object.values(profiles).map((p) => {
        const modalEdu = Object.keys(p._edu_scores).length
          ? parseInt(Object.entries(p._edu_scores).sort((a, b) => b[1] - a[1])[0][0])
          : 0;

        return {
          onet_soc_code: p.onet_soc_code,
          title: p.title,
          description: p.description,
          job_zone: p.job_zone,
          education_level: EDU_LABELS[modalEdu] || "",
          skills: [...p.skills].sort().slice(0, 50),
          knowledge: [...p.knowledge].sort().slice(0, 30),
          abilities: [...p.abilities].sort().slice(0, 30),
          work_activities: [...p.work_activities].sort().slice(0, 30),
          work_styles: [...p.work_styles].sort().slice(0, 20),
          work_values: topN(p._wv_scores, 3),
          riasec_profile: topN(p._riasec_scores, 3),
          tasks: [...p.tasks].sort().slice(0, 30),
          emerging_tasks: [...p.emerging_tasks].sort().slice(0, 10),
          tech: [...p.tech].sort().slice(0, 40),
          related_socs: p.related_socs.slice(0, 5),
          alternate_titles: [...p.alternate_titles].sort().slice(0, 30),
          last_updated: new Date().toISOString(),
        };
      });

      console.log(`Compiled ${compiled.length} profiles, starting bulk create...`);

      // BulkCreate in batches of 100
      let imported = 0;
      let errors = 0;
      for (let i = 0; i < compiled.length; i += 100) {
        const batch = compiled.slice(i, i + 100);
        try {
          await base44.asServiceRole.entities.ONetProfile.bulkCreate(batch);
          imported += batch.length;
        } catch (e) {
          // Fallback: smaller batches
          for (let j = 0; j < batch.length; j += 20) {
            const small = batch.slice(j, j + 20);
            try {
              await base44.asServiceRole.entities.ONetProfile.bulkCreate(small);
              imported += small.length;
            } catch (_) {
              errors += small.length;
            }
          }
        }
        if (i % 500 === 0) console.log(`Progress: ${i}/${compiled.length}`);
        await sleep(100);
      }

      return Response.json({
        success: true,
        stats: { total: compiled.length, imported, errors },
        sample: compiled.length > 0 ? compiled[0] : null,
      });
    }

    if (action === "clear") {
      let deleted = 0;
      while (true) {
        const batch = await base44.asServiceRole.entities.ONetProfile.list("created_date", 50);
        if (!batch || batch.length === 0) break;
        for (const item of batch) {
          await base44.asServiceRole.entities.ONetProfile.delete(item.id);
          deleted++;
        }
        await sleep(200);
      }
      return Response.json({ success: true, deleted });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});
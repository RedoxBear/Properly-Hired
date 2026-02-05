/**
 * O*NET Data Aggregator
 *
 * Transforms raw O*NET CSV rows into aggregated occupation profiles.
 * Instead of 1.1M rows, creates ~1,000 comprehensive occupation profiles.
 *
 * Each profile contains:
 * - Basic occupation info (title, description, job_zone)
 * - Skills array with importance/level ratings
 * - Abilities array with importance/level ratings
 * - Knowledge array with importance/level ratings
 * - Tasks array
 * - Work activities, context, technology, interests
 * - Related occupations
 * - Alternate titles
 */

import { ONET_SCHEMAS, parseCSVWithSchema, getSchemaByFileName } from './onetSchemas';

/**
 * Aggregation state - builds profiles as files are processed
 */
class ONetAggregator {
    constructor() {
        this.profiles = new Map(); // soc_code -> profile
        this.referenceData = {
            scales: new Map(),
            contentModel: new Map(),
            jobZones: new Map(),
            iwa: new Map(),
            dwa: new Map()
        };
        this.processedFiles = new Set();
        this.stats = {
            filesProcessed: 0,
            rowsProcessed: 0,
            occupationsFound: 0,
            errors: []
        };
    }

    /**
     * Get or create profile for SOC code
     */
    getProfile(socCode) {
        if (!this.profiles.has(socCode)) {
            this.profiles.set(socCode, {
                soc_code: socCode,
                title: '',
                description: '',
                job_zone: null,
                skills: [],
                abilities: [],
                knowledge: [],
                tasks: [],
                work_activities: [],
                work_context: [],
                technology_skills: [],
                tools: [],
                interests: [],
                work_styles: [],
                work_values: [],
                education_requirements: [],
                alternate_titles: [],
                related_occupations: [],
                metadata: {}
            });
        }
        return this.profiles.get(socCode);
    }

    /**
     * Process a CSV file and aggregate into profiles
     */
    processFile(fileName, csvText) {
        const schema = getSchemaByFileName(fileName);
        if (!schema) {
            this.stats.errors.push(`Unknown file: ${fileName}`);
            return { success: false, error: `Unknown file: ${fileName}` };
        }

        // Skip if already processed
        if (this.processedFiles.has(fileName)) {
            return { success: true, skipped: true, message: 'Already processed' };
        }

        try {
            const records = parseCSVWithSchema(csvText, schema);
            this.stats.rowsProcessed += records.length;

            // Route to appropriate handler based on file type
            const handler = this.getHandler(fileName);
            if (handler) {
                handler.call(this, records, schema);
            }

            this.processedFiles.add(fileName);
            this.stats.filesProcessed++;
            this.stats.occupationsFound = this.profiles.size;

            return {
                success: true,
                rowsProcessed: records.length,
                occupationsNow: this.profiles.size
            };
        } catch (e) {
            this.stats.errors.push(`${fileName}: ${e.message}`);
            return { success: false, error: e.message };
        }
    }

    /**
     * Get handler function for file type
     */
    getHandler(fileName) {
        const handlers = {
            // Phase 1: Reference tables
            'Scales_Reference.csv': this.handleScales,
            'Content_Model_Reference.csv': this.handleContentModel,
            'Job_Zone_Reference.csv': this.handleJobZoneRef,
            'IWA_Reference.csv': this.handleIWA,
            'DWA_Reference.csv': this.handleDWA,

            // Phase 2: Core occupation data
            'Occupation_Data.csv': this.handleOccupationData,
            'Alternate_Titles.csv': this.handleAlternateTitles,
            'Job_Zones.csv': this.handleJobZones,
            'Related_Occupations.csv': this.handleRelatedOccupations,

            // Phase 3: Competencies
            'Skills.csv': this.handleSkills,
            'Abilities.csv': this.handleAbilities,
            'Knowledge.csv': this.handleKnowledge,
            'Interests.csv': this.handleInterests,
            'Work_Styles.csv': this.handleWorkStyles,
            'Work_Values.csv': this.handleWorkValues,
            'Education_Training_and_Experience.csv': this.handleEducation,

            // Phase 4: Tasks
            'Task_Statements.csv': this.handleTaskStatements,
            'Task_Ratings.csv': this.handleTaskRatings,
            'Emerging_Tasks.csv': this.handleEmergingTasks,

            // Phase 5: Work Activities & Context
            'Work_Activities.csv': this.handleWorkActivities,
            'Work_Context.csv': this.handleWorkContext,

            // Phase 6: Technology
            'Technology_Skills.csv': this.handleTechnologySkills,
            'Tools_Used.csv': this.handleTools
        };

        return handlers[fileName];
    }

    // ===== Reference Table Handlers =====

    handleScales(records) {
        for (const r of records) {
            this.referenceData.scales.set(r.element_id, {
                name: r.element_name,
                min: r.min_value,
                max: r.max_value
            });
        }
    }

    handleContentModel(records) {
        for (const r of records) {
            this.referenceData.contentModel.set(r.element_id, {
                name: r.element_name,
                description: r.description
            });
        }
    }

    handleJobZoneRef(records) {
        for (const r of records) {
            this.referenceData.jobZones.set(r.element_id, {
                name: r.element_name,
                education: r.education,
                experience: r.experience,
                training: r.training
            });
        }
    }

    handleIWA(records) {
        for (const r of records) {
            this.referenceData.iwa.set(r.iwa_id, r.iwa_title);
        }
    }

    handleDWA(records) {
        for (const r of records) {
            this.referenceData.dwa.set(r.dwa_id, {
                title: r.dwa_title,
                iwa_id: r.iwa_id
            });
        }
    }

    // ===== Occupation Data Handlers =====

    handleOccupationData(records) {
        for (const r of records) {
            const profile = this.getProfile(r.soc_code);
            profile.title = r.title;
            profile.description = r.description;
        }
    }

    handleAlternateTitles(records) {
        // Group by SOC code
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);
            profile.alternate_titles = rows.map(r => ({
                title: r.alternate_title,
                short_title: r.short_title
            })).slice(0, 50); // Limit to 50 alternates
        }
    }

    handleJobZones(records) {
        for (const r of records) {
            const profile = this.getProfile(r.soc_code);
            profile.job_zone = r.job_zone;
        }
    }

    handleRelatedOccupations(records) {
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);
            profile.related_occupations = rows
                .sort((a, b) => (b.relatedness_index || 0) - (a.relatedness_index || 0))
                .slice(0, 20)
                .map(r => ({
                    soc_code: r.related_soc_code,
                    title: r.related_title,
                    tier: r.relatedness_tier,
                    index: r.relatedness_index
                }));
        }
    }

    // ===== Competency Handlers =====

    handleSkills(records) {
        this.handleCompetency(records, 'skills');
    }

    handleAbilities(records) {
        this.handleCompetency(records, 'abilities');
    }

    handleKnowledge(records) {
        this.handleCompetency(records, 'knowledge');
    }

    handleInterests(records) {
        this.handleCompetency(records, 'interests');
    }

    handleWorkStyles(records) {
        this.handleCompetency(records, 'work_styles');
    }

    handleWorkValues(records) {
        this.handleCompetency(records, 'work_values');
    }

    /**
     * Generic competency handler - aggregates importance/level by element
     */
    handleCompetency(records, fieldName) {
        // Group by SOC code
        const bySoc = this.groupBySoc(records);

        for (const [socCode, rows] of bySoc) {
            const profile = this.getProfile(socCode);

            // Group by element within this occupation
            const byElement = new Map();
            for (const r of rows) {
                const key = r.element_id;
                if (!byElement.has(key)) {
                    byElement.set(key, {
                        element_id: r.element_id,
                        name: r.element_name,
                        importance: null,
                        level: null
                    });
                }
                const elem = byElement.get(key);
                // IM = Importance, LV = Level
                if (r.scale_id === 'IM') {
                    elem.importance = r.data_value;
                } else if (r.scale_id === 'LV') {
                    elem.level = r.data_value;
                }
            }

            // Convert to array and sort by importance
            profile[fieldName] = Array.from(byElement.values())
                .filter(e => e.importance !== null)
                .sort((a, b) => (b.importance || 0) - (a.importance || 0))
                .slice(0, 35); // Keep top 35
        }
    }

    handleEducation(records) {
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);
            // Summarize education requirements
            const summary = {};
            for (const r of rows) {
                const key = `${r.element_name}_${r.category || 'default'}`;
                if (!summary[key] || r.data_value > summary[key].value) {
                    summary[key] = {
                        element: r.element_name,
                        category: r.category,
                        value: r.data_value
                    };
                }
            }
            profile.education_requirements = Object.values(summary).slice(0, 20);
        }
    }

    // ===== Task Handlers =====

    handleTaskStatements(records) {
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);
            profile.tasks = rows.map(r => ({
                task_id: r.task_id,
                task: r.task,
                type: r.task_type
            })).slice(0, 50); // Limit to 50 tasks
        }
    }

    handleTaskRatings(records) {
        // Add ratings to existing tasks
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);
            const taskMap = new Map(profile.tasks.map(t => [t.task_id, t]));

            for (const r of rows) {
                const task = taskMap.get(r.task_id);
                if (task) {
                    if (r.scale_id === 'IM') {
                        task.importance = r.data_value;
                    } else if (r.scale_id === 'FT') {
                        task.frequency = r.data_value;
                    }
                }
            }

            // Sort by importance
            profile.tasks = profile.tasks
                .sort((a, b) => (b.importance || 0) - (a.importance || 0))
                .slice(0, 30);
        }
    }

    handleEmergingTasks(records) {
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);
            // Add emerging tasks flag
            for (const r of rows) {
                profile.tasks.push({
                    task: r.task,
                    type: 'emerging',
                    category: r.category
                });
            }
        }
    }

    // ===== Work Activity/Context Handlers =====

    handleWorkActivities(records) {
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);

            const byElement = new Map();
            for (const r of rows) {
                const key = r.element_id;
                if (!byElement.has(key)) {
                    byElement.set(key, {
                        element_id: r.element_id,
                        name: r.element_name,
                        importance: null,
                        level: null
                    });
                }
                const elem = byElement.get(key);
                if (r.scale_id === 'IM') {
                    elem.importance = r.data_value;
                } else if (r.scale_id === 'LV') {
                    elem.level = r.data_value;
                }
            }

            profile.work_activities = Array.from(byElement.values())
                .filter(e => e.importance !== null)
                .sort((a, b) => (b.importance || 0) - (a.importance || 0))
                .slice(0, 41);
        }
    }

    handleWorkContext(records) {
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);

            // Aggregate work context by element
            const byElement = new Map();
            for (const r of rows) {
                const key = r.element_id;
                if (!byElement.has(key)) {
                    byElement.set(key, {
                        element_id: r.element_id,
                        name: r.element_name,
                        categories: []
                    });
                }
                const elem = byElement.get(key);
                if (r.category && r.data_value > 0) {
                    elem.categories.push({
                        category: r.category,
                        value: r.data_value
                    });
                }
            }

            // Find dominant category for each element
            profile.work_context = Array.from(byElement.values())
                .map(e => {
                    const topCategory = e.categories.sort((a, b) => b.value - a.value)[0];
                    return {
                        element_id: e.element_id,
                        name: e.name,
                        dominant_category: topCategory?.category,
                        value: topCategory?.value
                    };
                })
                .filter(e => e.dominant_category)
                .slice(0, 57);
        }
    }

    // ===== Technology Handlers =====

    handleTechnologySkills(records) {
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);

            // Deduplicate and prioritize hot technologies
            const seen = new Set();
            profile.technology_skills = rows
                .filter(r => {
                    if (seen.has(r.commodity_title)) return false;
                    seen.add(r.commodity_title);
                    return true;
                })
                .sort((a, b) => {
                    // Hot tech first, then in-demand
                    if (a.hot_technology && !b.hot_technology) return -1;
                    if (!a.hot_technology && b.hot_technology) return 1;
                    if (a.in_demand && !b.in_demand) return -1;
                    if (!a.in_demand && b.in_demand) return 1;
                    return 0;
                })
                .slice(0, 30)
                .map(r => ({
                    name: r.commodity_title,
                    example: r.example,
                    hot: r.hot_technology,
                    in_demand: r.in_demand
                }));
        }
    }

    handleTools(records) {
        const grouped = this.groupBySoc(records);
        for (const [socCode, rows] of grouped) {
            const profile = this.getProfile(socCode);

            const seen = new Set();
            profile.tools = rows
                .filter(r => {
                    if (seen.has(r.commodity_title)) return false;
                    seen.add(r.commodity_title);
                    return true;
                })
                .slice(0, 20)
                .map(r => ({
                    name: r.commodity_title,
                    example: r.example
                }));
        }
    }

    // ===== Utility Methods =====

    groupBySoc(records) {
        const groups = new Map();
        for (const r of records) {
            const soc = r.soc_code;
            if (!soc) continue;
            if (!groups.has(soc)) {
                groups.set(soc, []);
            }
            groups.get(soc).push(r);
        }
        return groups;
    }

    /**
     * Get all aggregated profiles
     */
    getProfiles() {
        return Array.from(this.profiles.values()).filter(p => p.title); // Only profiles with titles
    }

    /**
     * Get aggregation statistics
     */
    getStats() {
        return {
            ...this.stats,
            profileCount: this.profiles.size,
            profilesWithTitle: this.getProfiles().length,
            processedFiles: Array.from(this.processedFiles)
        };
    }

    /**
     * Reset aggregator state
     */
    reset() {
        this.profiles.clear();
        this.processedFiles.clear();
        this.stats = {
            filesProcessed: 0,
            rowsProcessed: 0,
            occupationsFound: 0,
            errors: []
        };
    }
}

// Export singleton for use across import session
export const onetAggregator = new ONetAggregator();

// Export class for testing
export { ONetAggregator };

/**
 * Generate a unique composite key for deduplication
 */
export function generateRecordKey(record, schema) {
    const fileName = schema.fileName;

    // File-specific composite keys
    const keyGenerators = {
        'Skills.csv': (r) => `${r.soc_code}_${r.element_id}_${r.scale_id}`,
        'Abilities.csv': (r) => `${r.soc_code}_${r.element_id}_${r.scale_id}`,
        'Knowledge.csv': (r) => `${r.soc_code}_${r.element_id}_${r.scale_id}`,
        'Task_Statements.csv': (r) => `${r.soc_code}_${r.task_id}`,
        'Task_Ratings.csv': (r) => `${r.soc_code}_${r.task_id}_${r.scale_id}`,
        'Work_Activities.csv': (r) => `${r.soc_code}_${r.element_id}_${r.scale_id}`,
        'Work_Context.csv': (r) => `${r.soc_code}_${r.element_id}_${r.scale_id}_${r.category || ''}`,
        'Occupation_Data.csv': (r) => r.soc_code,
        'Alternate_Titles.csv': (r) => `${r.soc_code}_${r.alternate_title}`,
        'Related_Occupations.csv': (r) => `${r.soc_code}_${r.related_soc_code}`,
        'Technology_Skills.csv': (r) => `${r.soc_code}_${r.commodity_code}_${r.example || ''}`,
        'Tools_Used.csv': (r) => `${r.soc_code}_${r.commodity_code}_${r.example || ''}`
    };

    const generator = keyGenerators[fileName];
    if (generator) {
        return generator(record);
    }

    // Fallback: use all primary fields
    return `${record.soc_code || ''}_${record.element_id || ''}_${record.task_id || ''}_${record.scale_id || ''}`;
}

export default onetAggregator;

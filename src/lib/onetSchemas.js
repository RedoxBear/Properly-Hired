/**
 * O*NET Schema Definitions for all 40 CSV files
 *
 * Schema structure:
 * - fileName: exact CSV file name from O*NET download
 * - columns: array of column names matching CSV headers
 * - entity: target Base44 entity for storage
 * - rowCount: expected row count for validation
 * - phase: import phase (1-7) for proper ordering
 * - description: human-readable description
 */

export const ONET_PHASES = {
  1: { name: "Reference Tables", description: "Small reference data imported first" },
  2: { name: "Occupations", description: "SOC codes required by all other tables" },
  3: { name: "Core Competencies", description: "Skills, abilities, knowledge, interests" },
  4: { name: "Tasks", description: "Task statements and ratings" },
  5: { name: "Work Activities & Context", description: "Work activities and context data" },
  6: { name: "Technology & Crosswalks", description: "Technology skills and relationship mappings" },
  7: { name: "Supplemental", description: "Additional metadata and crosswalk files" }
};

export const ONET_ENTITIES = {
  ONetOccupation: {
    description: "Occupation data with titles, descriptions, job zones",
    sources: ["Occupation_Data.csv", "Alternate_Titles.csv", "Job_Zones.csv", "Related_Occupations.csv"]
  },
  ONetSkill: {
    description: "Skills data including importance and level ratings",
    sources: ["Skills.csv", "Skills_to_Work_Activities.csv"]
  },
  ONetAbility: {
    description: "Abilities data including importance and level ratings",
    sources: ["Abilities.csv", "Abilities_to_Work_Activities.csv"]
  },
  ONetKnowledge: {
    description: "Knowledge areas required for occupations",
    sources: ["Knowledge.csv"]
  },
  ONetTask: {
    description: "Task statements and ratings for occupations",
    sources: ["Task_Statements.csv", "Task_Ratings.csv", "Emerging_Tasks.csv"]
  },
  ONetWorkActivity: {
    description: "Work activities including IWA and DWA references",
    sources: ["Work_Activities.csv", "IWA_Reference.csv", "DWA_Reference.csv"]
  },
  ONetWorkContext: {
    description: "Work context and environment information",
    sources: ["Work_Context.csv", "Work_Context_Categories.csv"]
  },
  ONetReference: {
    description: "Reference tables for scales, content model, job zones, etc.",
    sources: ["Content_Model_Reference.csv", "Scales_Reference.csv", "Job_Zone_Reference.csv",
              "Technology_Skills.csv", "Tools_Used.csv", "Interests.csv", "Work_Styles.csv", "Work_Values.csv"]
  }
};

export const ONET_SCHEMAS = {
  // ============================================
  // PHASE 1: Reference Tables (import first)
  // ============================================

  "Content_Model_Reference.csv": {
    fileName: "Content_Model_Reference.csv",
    phase: 1,
    entity: "ONetReference",
    rowCount: 630,
    description: "Content model element definitions",
    columns: ["Element ID", "Element Name", "Description"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Description": "description"
    },
    entityFields: {
      type: "content_model"
    }
  },

  "Scales_Reference.csv": {
    fileName: "Scales_Reference.csv",
    phase: 1,
    entity: "ONetReference",
    rowCount: 31,
    description: "Scale definitions (importance, level, etc.)",
    columns: ["Scale ID", "Scale Name", "Minimum", "Maximum"],
    fieldMappings: {
      "Scale ID": "element_id",
      "Scale Name": "element_name",
      "Minimum": "min_value",
      "Maximum": "max_value"
    },
    entityFields: {
      type: "scale"
    }
  },

  "Job_Zone_Reference.csv": {
    fileName: "Job_Zone_Reference.csv",
    phase: 1,
    entity: "ONetReference",
    rowCount: 5,
    description: "Job zone definitions and requirements",
    columns: ["Job Zone", "Name", "Experience", "Education", "Job Training", "Examples", "SVP Range"],
    fieldMappings: {
      "Job Zone": "element_id",
      "Name": "element_name",
      "Experience": "experience",
      "Education": "education",
      "Job Training": "training",
      "Examples": "examples",
      "SVP Range": "svp_range"
    },
    entityFields: {
      type: "job_zone"
    }
  },

  "Level_Scale_Anchors.csv": {
    fileName: "Level_Scale_Anchors.csv",
    phase: 1,
    entity: "ONetReference",
    rowCount: 483,
    description: "Anchor descriptions for level scales",
    columns: ["Element ID", "Element Name", "Scale ID", "Scale Name", "Anchor Value", "Anchor Description"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Anchor Value": "anchor_value",
      "Anchor Description": "description"
    },
    entityFields: {
      type: "level_anchor"
    }
  },

  "Task_Categories.csv": {
    fileName: "Task_Categories.csv",
    phase: 1,
    entity: "ONetReference",
    rowCount: 7,
    description: "Task category definitions",
    columns: ["Scale ID", "Scale Name", "Category", "Category Description"],
    fieldMappings: {
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Category": "element_id",
      "Category Description": "description"
    },
    entityFields: {
      type: "task_category"
    }
  },

  "IWA_Reference.csv": {
    fileName: "IWA_Reference.csv",
    phase: 1,
    entity: "ONetWorkActivity",
    rowCount: 332,
    description: "Intermediate Work Activities reference",
    columns: ["Element ID", "Element Name", "IWA ID", "IWA Title"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "IWA ID": "iwa_id",
      "IWA Title": "iwa_title"
    },
    entityFields: {
      is_reference: true,
      activity_type: "iwa"
    }
  },

  "DWA_Reference.csv": {
    fileName: "DWA_Reference.csv",
    phase: 1,
    entity: "ONetWorkActivity",
    rowCount: 2087,
    description: "Detailed Work Activities reference",
    columns: ["Element ID", "Element Name", "IWA ID", "IWA Title", "DWA ID", "DWA Title"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "IWA ID": "iwa_id",
      "IWA Title": "iwa_title",
      "DWA ID": "dwa_id",
      "DWA Title": "dwa_title"
    },
    entityFields: {
      is_reference: true,
      activity_type: "dwa"
    }
  },

  "UNSPSC_Reference.csv": {
    fileName: "UNSPSC_Reference.csv",
    phase: 1,
    entity: "ONetReference",
    rowCount: 4264,
    description: "UNSPSC commodity codes for tools/technology",
    columns: ["Commodity Code", "Commodity Title", "Class Code", "Class Title", "Family Code", "Family Title", "Segment Code", "Segment Title"],
    fieldMappings: {
      "Commodity Code": "element_id",
      "Commodity Title": "element_name",
      "Class Code": "class_code",
      "Class Title": "class_title",
      "Family Code": "family_code",
      "Family Title": "family_title",
      "Segment Code": "segment_code",
      "Segment Title": "segment_title"
    },
    entityFields: {
      type: "unspsc"
    }
  },

  // ============================================
  // PHASE 2: Occupations (SOC codes - critical)
  // ============================================

  "Occupation_Data.csv": {
    fileName: "Occupation_Data.csv",
    phase: 2,
    entity: "ONetOccupation",
    rowCount: 1016,
    description: "Core occupation titles and descriptions (CRITICAL)",
    columns: ["O*NET-SOC Code", "Title", "Description"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "title",
      "Description": "description"
    },
    critical: true
  },

  "Alternate_Titles.csv": {
    fileName: "Alternate_Titles.csv",
    phase: 2,
    entity: "ONetOccupation",
    rowCount: 56505,
    description: "Alternative job titles for occupations",
    columns: ["O*NET-SOC Code", "Title", "Alternate Title", "Short Title", "Source(s)"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "title",
      "Alternate Title": "alternate_title",
      "Short Title": "short_title",
      "Source(s)": "sources"
    },
    mergeMode: "append_array",
    mergeField: "alternate_titles"
  },

  "Job_Zones.csv": {
    fileName: "Job_Zones.csv",
    phase: 2,
    entity: "ONetOccupation",
    rowCount: 923,
    description: "Job zone assignments for occupations",
    columns: ["O*NET-SOC Code", "Title", "Job Zone", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "title",
      "Job Zone": "job_zone",
      "Date": "date",
      "Domain Source": "domain_source"
    },
    mergeMode: "update",
    mergeField: "job_zone"
  },

  "Related_Occupations.csv": {
    fileName: "Related_Occupations.csv",
    phase: 2,
    entity: "ONetOccupation",
    rowCount: 18460,
    description: "Related occupation mappings",
    columns: ["O*NET-SOC Code", "Title", "Related O*NET-SOC Code", "Related Title", "Relatedness Tier", "Index"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "title",
      "Related O*NET-SOC Code": "related_soc_code",
      "Related Title": "related_title",
      "Relatedness Tier": "relatedness_tier",
      "Index": "relatedness_index"
    },
    mergeMode: "append_array",
    mergeField: "related_occupations"
  },

  // ============================================
  // PHASE 3: Core Competencies
  // ============================================

  "Skills.csv": {
    fileName: "Skills.csv",
    phase: 3,
    entity: "ONetSkill",
    rowCount: 62580,
    description: "Skills data with importance and level ratings",
    columns: ["O*NET-SOC Code", "Title", "Element ID", "Element Name", "Scale ID", "Scale Name", "Data Value", "N", "Standard Error", "Lower CI Bound", "Upper CI Bound", "Recommend Suppress", "Not Relevant", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Data Value": "data_value",
      "N": "sample_size",
      "Standard Error": "standard_error",
      "Lower CI Bound": "lower_ci",
      "Upper CI Bound": "upper_ci",
      "Recommend Suppress": "recommend_suppress",
      "Not Relevant": "not_relevant",
      "Date": "date",
      "Domain Source": "domain_source"
    }
  },

  "Abilities.csv": {
    fileName: "Abilities.csv",
    phase: 3,
    entity: "ONetAbility",
    rowCount: 92976,
    description: "Abilities data with importance and level ratings",
    columns: ["O*NET-SOC Code", "Title", "Element ID", "Element Name", "Scale ID", "Scale Name", "Data Value", "N", "Standard Error", "Lower CI Bound", "Upper CI Bound", "Recommend Suppress", "Not Relevant", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Data Value": "data_value",
      "N": "sample_size",
      "Standard Error": "standard_error",
      "Lower CI Bound": "lower_ci",
      "Upper CI Bound": "upper_ci",
      "Recommend Suppress": "recommend_suppress",
      "Not Relevant": "not_relevant",
      "Date": "date",
      "Domain Source": "domain_source"
    }
  },

  "Knowledge.csv": {
    fileName: "Knowledge.csv",
    phase: 3,
    entity: "ONetKnowledge",
    rowCount: 59004,
    description: "Knowledge areas with importance and level ratings",
    columns: ["O*NET-SOC Code", "Title", "Element ID", "Element Name", "Scale ID", "Scale Name", "Data Value", "N", "Standard Error", "Lower CI Bound", "Upper CI Bound", "Recommend Suppress", "Not Relevant", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Data Value": "data_value",
      "N": "sample_size",
      "Standard Error": "standard_error",
      "Lower CI Bound": "lower_ci",
      "Upper CI Bound": "upper_ci",
      "Recommend Suppress": "recommend_suppress",
      "Not Relevant": "not_relevant",
      "Date": "date",
      "Domain Source": "domain_source"
    }
  },

  "Interests.csv": {
    fileName: "Interests.csv",
    phase: 3,
    entity: "ONetReference",
    rowCount: 8307,
    description: "RIASEC interest profiles for occupations",
    columns: ["O*NET-SOC Code", "Title", "Element ID", "Element Name", "Scale ID", "Scale Name", "Data Value", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Data Value": "data_value",
      "Date": "date",
      "Domain Source": "domain_source"
    },
    entityFields: {
      type: "interest"
    }
  },

  "Work_Styles.csv": {
    fileName: "Work_Styles.csv",
    phase: 3,
    entity: "ONetReference",
    rowCount: 37422,
    description: "Work style traits for occupations",
    columns: ["O*NET-SOC Code", "Title", "Element ID", "Element Name", "Scale ID", "Scale Name", "Data Value", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Data Value": "data_value",
      "Date": "date",
      "Domain Source": "domain_source"
    },
    entityFields: {
      type: "work_style"
    }
  },

  "Work_Values.csv": {
    fileName: "Work_Values.csv",
    phase: 3,
    entity: "ONetReference",
    rowCount: 7866,
    description: "Work values for occupations (legacy)",
    columns: ["O*NET-SOC Code", "Title", "Element ID", "Element Name", "Scale ID", "Scale Name", "Data Value", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Data Value": "data_value",
      "Date": "date",
      "Domain Source": "domain_source"
    },
    entityFields: {
      type: "work_value"
    }
  },

  "Education_Training_and_Experience.csv": {
    fileName: "Education_Training_and_Experience.csv",
    phase: 3,
    entity: "ONetReference",
    rowCount: 37125,
    description: "Education, training, experience requirements",
    columns: ["O*NET-SOC Code", "Title", "Element ID", "Element Name", "Scale ID", "Scale Name", "Category", "Data Value", "N", "Standard Error", "Lower CI Bound", "Upper CI Bound", "Recommend Suppress", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Category": "category",
      "Data Value": "data_value",
      "N": "sample_size",
      "Standard Error": "standard_error",
      "Lower CI Bound": "lower_ci",
      "Upper CI Bound": "upper_ci",
      "Recommend Suppress": "recommend_suppress",
      "Date": "date",
      "Domain Source": "domain_source"
    },
    entityFields: {
      type: "education_training"
    }
  },

  // ============================================
  // PHASE 4: Tasks
  // ============================================

  "Task_Statements.csv": {
    fileName: "Task_Statements.csv",
    phase: 4,
    entity: "ONetTask",
    rowCount: 18796,
    description: "Task statements for occupations",
    columns: ["O*NET-SOC Code", "Title", "Task ID", "Task", "Task Type", "Incumbents Responding", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Task ID": "task_id",
      "Task": "task",
      "Task Type": "task_type",
      "Incumbents Responding": "incumbents_responding",
      "Date": "date",
      "Domain Source": "domain_source"
    }
  },

  "Task_Ratings.csv": {
    fileName: "Task_Ratings.csv",
    phase: 4,
    entity: "ONetTask",
    rowCount: 161559,
    description: "Task importance and frequency ratings (LARGE)",
    columns: ["O*NET-SOC Code", "Title", "Task ID", "Task", "Scale ID", "Scale Name", "Category", "Data Value", "N", "Standard Error", "Lower CI Bound", "Upper CI Bound", "Recommend Suppress", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Task ID": "task_id",
      "Task": "task",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Category": "category",
      "Data Value": "data_value",
      "N": "sample_size",
      "Standard Error": "standard_error",
      "Lower CI Bound": "lower_ci",
      "Upper CI Bound": "upper_ci",
      "Recommend Suppress": "recommend_suppress",
      "Date": "date",
      "Domain Source": "domain_source"
    },
    large: true
  },

  "Emerging_Tasks.csv": {
    fileName: "Emerging_Tasks.csv",
    phase: 4,
    entity: "ONetTask",
    rowCount: 328,
    description: "Newly identified emerging tasks",
    columns: ["O*NET-SOC Code", "Title", "Task", "Category", "Original Task ID", "Original Task", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Task": "task",
      "Category": "category",
      "Original Task ID": "original_task_id",
      "Original Task": "original_task",
      "Date": "date",
      "Domain Source": "domain_source"
    },
    entityFields: {
      is_emerging: true
    }
  },

  "Tasks_to_DWAs.csv": {
    fileName: "Tasks_to_DWAs.csv",
    phase: 4,
    entity: "ONetTask",
    rowCount: 23850,
    description: "Task to Detailed Work Activity mappings",
    columns: ["O*NET-SOC Code", "Title", "Task ID", "Task", "DWA ID", "DWA Title", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Task ID": "task_id",
      "Task": "task",
      "DWA ID": "dwa_id",
      "DWA Title": "dwa_title",
      "Date": "date",
      "Domain Source": "domain_source"
    }
  },

  // ============================================
  // PHASE 5: Work Activities & Context
  // ============================================

  "Work_Activities.csv": {
    fileName: "Work_Activities.csv",
    phase: 5,
    entity: "ONetWorkActivity",
    rowCount: 73308,
    description: "Generalized work activities",
    columns: ["O*NET-SOC Code", "Title", "Element ID", "Element Name", "Scale ID", "Scale Name", "Data Value", "N", "Standard Error", "Lower CI Bound", "Upper CI Bound", "Recommend Suppress", "Not Relevant", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Data Value": "data_value",
      "N": "sample_size",
      "Standard Error": "standard_error",
      "Lower CI Bound": "lower_ci",
      "Upper CI Bound": "upper_ci",
      "Recommend Suppress": "recommend_suppress",
      "Not Relevant": "not_relevant",
      "Date": "date",
      "Domain Source": "domain_source"
    }
  },

  "Work_Context.csv": {
    fileName: "Work_Context.csv",
    phase: 5,
    entity: "ONetWorkContext",
    rowCount: 297676,
    description: "Work environment and context (LARGEST FILE)",
    columns: ["O*NET-SOC Code", "Title", "Element ID", "Element Name", "Scale ID", "Scale Name", "Category", "Data Value", "N", "Standard Error", "Lower CI Bound", "Upper CI Bound", "Recommend Suppress", "Not Relevant", "Date", "Domain Source"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Category": "category",
      "Data Value": "data_value",
      "N": "sample_size",
      "Standard Error": "standard_error",
      "Lower CI Bound": "lower_ci",
      "Upper CI Bound": "upper_ci",
      "Recommend Suppress": "recommend_suppress",
      "Not Relevant": "not_relevant",
      "Date": "date",
      "Domain Source": "domain_source"
    },
    large: true
  },

  "Work_Context_Categories.csv": {
    fileName: "Work_Context_Categories.csv",
    phase: 5,
    entity: "ONetWorkContext",
    rowCount: 281,
    description: "Work context category definitions",
    columns: ["Element ID", "Element Name", "Scale ID", "Scale Name", "Category", "Category Description"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Category": "category",
      "Category Description": "category_description"
    },
    entityFields: {
      is_reference: true
    }
  },

  // ============================================
  // PHASE 6: Technology & Crosswalks
  // ============================================

  "Technology_Skills.csv": {
    fileName: "Technology_Skills.csv",
    phase: 6,
    entity: "ONetReference",
    rowCount: 32773,
    description: "Technology skills and software",
    columns: ["O*NET-SOC Code", "Title", "Example", "Commodity Code", "Commodity Title", "Hot Technology", "In Demand"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Example": "example",
      "Commodity Code": "commodity_code",
      "Commodity Title": "commodity_title",
      "Hot Technology": "hot_technology",
      "In Demand": "in_demand"
    },
    entityFields: {
      type: "technology_skill"
    }
  },

  "Tools_Used.csv": {
    fileName: "Tools_Used.csv",
    phase: 6,
    entity: "ONetReference",
    rowCount: 41662,
    description: "Tools used in occupations (legacy)",
    columns: ["O*NET-SOC Code", "Title", "Example", "Commodity Code", "Commodity Title"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title",
      "Example": "example",
      "Commodity Code": "commodity_code",
      "Commodity Title": "commodity_title"
    },
    entityFields: {
      type: "tool"
    }
  },

  "Skills_to_Work_Activities.csv": {
    fileName: "Skills_to_Work_Activities.csv",
    phase: 6,
    entity: "ONetSkill",
    rowCount: 232,
    description: "Skills to work activities crosswalk",
    columns: ["Skills Element ID", "Skills Element Name", "Work Activities Element ID", "Work Activities Element Name"],
    fieldMappings: {
      "Skills Element ID": "element_id",
      "Skills Element Name": "element_name",
      "Work Activities Element ID": "work_activity_id",
      "Work Activities Element Name": "work_activity_name"
    },
    entityFields: {
      is_crosswalk: true
    }
  },

  "Abilities_to_Work_Activities.csv": {
    fileName: "Abilities_to_Work_Activities.csv",
    phase: 6,
    entity: "ONetAbility",
    rowCount: 381,
    description: "Abilities to work activities crosswalk",
    columns: ["Abilities Element ID", "Abilities Element Name", "Work Activities Element ID", "Work Activities Element Name"],
    fieldMappings: {
      "Abilities Element ID": "element_id",
      "Abilities Element Name": "element_name",
      "Work Activities Element ID": "work_activity_id",
      "Work Activities Element Name": "work_activity_name"
    },
    entityFields: {
      is_crosswalk: true
    }
  },

  // ============================================
  // PHASE 7: Supplemental Files
  // ============================================

  "Sample_of_Reported_Titles.csv": {
    fileName: "Sample_of_Reported_Titles.csv",
    phase: 7,
    entity: "ONetOccupation",
    rowCount: 7955,
    description: "Sample of reported job titles",
    columns: ["O*NET-SOC Code", "Title", "Reported Job Title", "Shown in My Next Move"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "title",
      "Reported Job Title": "reported_title",
      "Shown in My Next Move": "shown_in_next_move"
    },
    mergeMode: "append_array",
    mergeField: "reported_titles"
  },

  "Occupation_Level_Metadata.csv": {
    fileName: "Occupation_Level_Metadata.csv",
    phase: 7,
    entity: "ONetOccupation",
    rowCount: 32202,
    description: "Occupation-level metadata",
    columns: ["O*NET-SOC Code", "Title", "Item", "Response", "N", "Percent", "Date"],
    fieldMappings: {
      "O*NET-SOC Code": "soc_code",
      "Title": "title",
      "Item": "metadata_item",
      "Response": "response",
      "N": "sample_size",
      "Percent": "percent",
      "Date": "date"
    }
  },

  "Education_Training_and_Experience_Categories.csv": {
    fileName: "Education_Training_and_Experience_Categories.csv",
    phase: 7,
    entity: "ONetReference",
    rowCount: 41,
    description: "Education/training category definitions",
    columns: ["Element ID", "Element Name", "Scale ID", "Scale Name", "Category", "Category Description"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name",
      "Category": "category",
      "Category Description": "description"
    },
    entityFields: {
      type: "education_category"
    }
  },

  "Abilities_to_Work_Context.csv": {
    fileName: "Abilities_to_Work_Context.csv",
    phase: 7,
    entity: "ONetAbility",
    rowCount: 139,
    description: "Abilities to work context crosswalk",
    columns: ["Abilities Element ID", "Abilities Element Name", "Work Context Element ID", "Work Context Element Name"],
    fieldMappings: {
      "Abilities Element ID": "element_id",
      "Abilities Element Name": "element_name",
      "Work Context Element ID": "work_context_id",
      "Work Context Element Name": "work_context_name"
    },
    entityFields: {
      is_crosswalk: true
    }
  },

  "Skills_to_Work_Context.csv": {
    fileName: "Skills_to_Work_Context.csv",
    phase: 7,
    entity: "ONetSkill",
    rowCount: 96,
    description: "Skills to work context crosswalk",
    columns: ["Skills Element ID", "Skills Element Name", "Work Context Element ID", "Work Context Element Name"],
    fieldMappings: {
      "Skills Element ID": "element_id",
      "Skills Element Name": "element_name",
      "Work Context Element ID": "work_context_id",
      "Work Context Element Name": "work_context_name"
    },
    entityFields: {
      is_crosswalk: true
    }
  },

  "Survey_Booklet_Locations.csv": {
    fileName: "Survey_Booklet_Locations.csv",
    phase: 7,
    entity: "ONetReference",
    rowCount: 211,
    description: "Survey booklet item locations",
    columns: ["Element ID", "Element Name", "Survey Item Number", "Scale ID", "Scale Name"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Survey Item Number": "survey_item_number",
      "Scale ID": "scale_id",
      "Scale Name": "scale_name"
    },
    entityFields: {
      type: "survey_location"
    }
  },

  "Basic_Interests_to_RIASEC.csv": {
    fileName: "Basic_Interests_to_RIASEC.csv",
    phase: 7,
    entity: "ONetReference",
    rowCount: 53,
    description: "Basic interests to RIASEC mapping",
    columns: ["Basic Interests Element ID", "Basic Interests Element Name", "RIASEC Element ID", "RIASEC Element Name"],
    fieldMappings: {
      "Basic Interests Element ID": "element_id",
      "Basic Interests Element Name": "element_name",
      "RIASEC Element ID": "riasec_id",
      "RIASEC Element Name": "riasec_name"
    },
    entityFields: {
      type: "interest_riasec"
    }
  },

  "RIASEC_Keywords.csv": {
    fileName: "RIASEC_Keywords.csv",
    phase: 7,
    entity: "ONetReference",
    rowCount: 75,
    description: "RIASEC type keywords",
    columns: ["Element ID", "Element Name", "Keyword", "Keyword Type"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Keyword": "keyword",
      "Keyword Type": "keyword_type"
    },
    entityFields: {
      type: "riasec_keyword"
    }
  },

  "Interests_Illustrative_Activities.csv": {
    fileName: "Interests_Illustrative_Activities.csv",
    phase: 7,
    entity: "ONetReference",
    rowCount: 188,
    description: "Illustrative activities for interest types",
    columns: ["Element ID", "Element Name", "Interest Type", "Activity"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Interest Type": "interest_type",
      "Activity": "activity"
    },
    entityFields: {
      type: "interest_activity"
    }
  },

  "Interests_Illustrative_Occupations.csv": {
    fileName: "Interests_Illustrative_Occupations.csv",
    phase: 7,
    entity: "ONetReference",
    rowCount: 186,
    description: "Illustrative occupations for interest types",
    columns: ["Element ID", "Element Name", "Interest Type", "O*NET-SOC Code", "Title"],
    fieldMappings: {
      "Element ID": "element_id",
      "Element Name": "element_name",
      "Interest Type": "interest_type",
      "O*NET-SOC Code": "soc_code",
      "Title": "occupation_title"
    },
    entityFields: {
      type: "interest_occupation"
    }
  }
};

/**
 * Get schema by filename (case-insensitive)
 */
export function getSchemaByFileName(fileName) {
  const normalizedName = fileName.trim();
  return ONET_SCHEMAS[normalizedName] ||
         Object.values(ONET_SCHEMAS).find(s =>
           s.fileName.toLowerCase() === normalizedName.toLowerCase()
         );
}

/**
 * Get all schemas for a specific phase
 */
export function getSchemasByPhase(phase) {
  return Object.values(ONET_SCHEMAS).filter(s => s.phase === phase);
}

/**
 * Get import order (sorted by phase, then by critical flag)
 */
export function getImportOrder() {
  return Object.values(ONET_SCHEMAS).sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase;
    if (a.critical && !b.critical) return -1;
    if (!a.critical && b.critical) return 1;
    return a.rowCount - b.rowCount;
  });
}

/**
 * Get total expected row count
 */
export function getTotalRowCount() {
  return Object.values(ONET_SCHEMAS).reduce((sum, s) => sum + s.rowCount, 0);
}

/**
 * Parse CSV text to array of objects using schema
 */
export function parseCSVWithSchema(csvText, schema) {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const record = {};

    // Map columns using schema
    headers.forEach((header, idx) => {
      const fieldName = schema.fieldMappings[header];
      if (fieldName && values[idx] !== undefined) {
        let value = values[idx];

        // Type conversions
        if (['data_value', 'sample_size', 'standard_error', 'lower_ci', 'upper_ci',
             'min_value', 'max_value', 'anchor_value', 'percent', 'relatedness_index'].includes(fieldName)) {
          value = parseFloat(value) || 0;
        } else if (['job_zone'].includes(fieldName)) {
          value = parseInt(value) || 0;
        } else if (['hot_technology', 'in_demand', 'recommend_suppress', 'not_relevant',
                    'is_reference', 'is_crosswalk', 'is_emerging', 'shown_in_next_move'].includes(fieldName)) {
          value = value === 'Y' || value === 'true' || value === '1' || value === true;
        }

        record[fieldName] = value;
      }
    });

    // Add entity-specific fields
    if (schema.entityFields) {
      Object.assign(record, schema.entityFields);
    }

    records.push(record);
  }

  return records;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Validate parsed records against schema
 */
export function validateRecords(records, schema) {
  const errors = [];
  const expectedCount = schema.rowCount;

  if (records.length === 0) {
    errors.push("No records parsed from file");
  }

  // Allow 5% variance in row count
  const variance = expectedCount * 0.05;
  if (records.length < expectedCount - variance) {
    errors.push(`Row count ${records.length} is significantly less than expected ${expectedCount}`);
  }

  // Check required fields
  if (records.length > 0) {
    const sample = records[0];
    const requiredFields = Object.values(schema.fieldMappings);
    const missingFields = requiredFields.filter(f => sample[f] === undefined);
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    recordCount: records.length,
    expectedCount
  };
}

export default ONET_SCHEMAS;

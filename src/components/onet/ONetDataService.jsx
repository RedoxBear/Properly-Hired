/**
 * ONetDataService - API-First Query Service Layer
 *
 * Implements API-first architecture with local database fallback:
 * 1. Primary: O*NET Web Services API
 * 2. Fallback: Local Base44 database (when API unavailable/rate-limited)
 */

import { base44 } from "@/api/base44Client";

class ONetDataService {
  constructor() {
    this.apiAvailable = true;
    this.apiErrorCount = 0;
    this.API_ERROR_THRESHOLD = 3;
    this.lastApiCheck = null;
    this.API_RETRY_INTERVAL = 60000; // 1 minute before retry
  }

  /**
   * Reset API status (useful after confirming API is back online)
   */
  resetApiStatus() {
    this.apiAvailable = true;
    this.apiErrorCount = 0;
    this.lastApiCheck = null;
  }

  /**
   * Check if enough time has passed to retry the API
   */
  shouldRetryApi() {
    if (this.apiAvailable) return true;
    if (!this.lastApiCheck) return true;
    return Date.now() - this.lastApiCheck > this.API_RETRY_INTERVAL;
  }

  /**
   * Generic query method - tries API first, falls back to local DB
   * @param {string} type - Entity type (Occupation, Skill, Ability, Knowledge, Task, etc.)
   * @param {Object} params - Query parameters
   * @returns {Promise<{source: string, data: any}>}
   */
  async query(type, params = {}) {
    // Try API first if available
    if (this.apiAvailable || this.shouldRetryApi()) {
      try {
        const result = await this.queryApi(type, params);
        this.apiErrorCount = 0;
        this.apiAvailable = true;
        return { source: 'api', data: result };
      } catch (e) {
        console.warn(`O*NET API query failed (${type}):`, e.message);
        this.apiErrorCount++;
        this.lastApiCheck = Date.now();

        if (this.apiErrorCount >= this.API_ERROR_THRESHOLD) {
          console.warn(`O*NET API marked unavailable after ${this.API_ERROR_THRESHOLD} failures`);
          this.apiAvailable = false;
        }
      }
    }

    // Fallback to local database
    try {
      const result = await this.queryLocal(type, params);
      return { source: 'local', data: result };
    } catch (e) {
      console.error(`Local DB query failed (${type}):`, e);
      throw new Error(`Both API and local DB queries failed for ${type}`);
    }
  }

  /**
   * Query O*NET Web Services API
   */
  async queryApi(type, params) {
    const endpoint = this.buildApiEndpoint(type, params);

    const response = await base44.functions.invoke('queryONetAPI', {
      endpoint,
      params: this.buildApiParams(params)
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return this.transformApiResponse(type, response);
  }

  /**
   * Build API endpoint based on query type
   */
  buildApiEndpoint(type, params) {
    const endpoints = {
      Occupation: params.code ? `/online/occupations/${params.code}` : '/online/search',
      Skill: params.socCode ? `/online/occupations/${params.socCode}/summary/skills` : '/online/search',
      Ability: params.socCode ? `/online/occupations/${params.socCode}/summary/abilities` : '/online/search',
      Knowledge: params.socCode ? `/online/occupations/${params.socCode}/summary/knowledge` : '/online/search',
      Task: params.socCode ? `/online/occupations/${params.socCode}/summary/tasks` : '/online/search',
      Interest: params.socCode ? `/online/occupations/${params.socCode}/summary/interests` : '/online/search',
      WorkActivity: params.socCode ? `/online/occupations/${params.socCode}/summary/work_activities` : '/online/search',
      WorkContext: params.socCode ? `/online/occupations/${params.socCode}/summary/work_context` : '/online/search',
      Technology: params.socCode ? `/online/occupations/${params.socCode}/summary/technology_skills` : '/online/search',
      RelatedOccupations: params.socCode ? `/online/occupations/${params.socCode}/related/occupations` : null
    };

    return endpoints[type] || '/online/search';
  }

  /**
   * Build API query parameters
   */
  buildApiParams(params) {
    const apiParams = {};

    if (params.keyword) {
      apiParams.keyword = params.keyword;
    }
    if (params.start) {
      apiParams.start = params.start;
    }
    if (params.end) {
      apiParams.end = params.end;
    }

    return apiParams;
  }

  /**
   * Transform API response to standard format
   */
  transformApiResponse(type, response) {
    // Handle search results
    if (response.occupation) {
      return Array.isArray(response.occupation) ? response.occupation : [response.occupation];
    }

    // Handle skill/ability/knowledge summaries
    if (response.element) {
      return Array.isArray(response.element) ? response.element : [response.element];
    }

    // Handle tasks
    if (response.task) {
      return Array.isArray(response.task) ? response.task : [response.task];
    }

    // Handle related occupations
    if (response.careers) {
      return response.careers;
    }

    return response;
  }

  /**
   * Query local Base44 database
   */
  async queryLocal(type, params) {
    const entityMap = {
      Occupation: 'ONetOccupation',
      Skill: 'ONetSkill',
      Ability: 'ONetAbility',
      Knowledge: 'ONetKnowledge',
      Task: 'ONetTask',
      WorkActivity: 'ONetWorkActivity',
      WorkContext: 'ONetWorkContext',
      Reference: 'ONetReference',
      Interest: 'ONetReference',
      Technology: 'ONetReference'
    };

    const entityName = entityMap[type];
    if (!entityName) {
      throw new Error(`Unknown entity type: ${type}`);
    }

    const entity = base44.entities[entityName];
    if (!entity) {
      throw new Error(`Entity ${entityName} not found`);
    }

    // Build filter
    const filter = this.buildLocalFilter(type, params);
    const sort = params.sort || '-created_date';
    const limit = params.limit || 100;

    return entity.filter(filter, sort, limit);
  }

  /**
   * Build filter for local database query
   */
  buildLocalFilter(type, params) {
    const filter = {};

    if (params.socCode) {
      // ONetOccupation uses 'code', all others use 'occupation_code'
      if (type === 'Occupation') {
        filter.code = params.socCode;
      } else {
        filter.occupation_code = params.socCode;
      }
    }

    if (params.code) {
      filter.code = params.code;
    }

    if (params.elementId) {
      filter.element_id = params.elementId;
    }

    if (params.keyword) {
      // For local search, we'd need text search - return empty filter for now
      // The caller should use a different approach for text search
    }

    // Type-specific filters for Reference entity
    if (type === 'Interest') {
      filter.reference_type = 'import_batch';
      filter.notes = 'Interests';
    } else if (type === 'Technology') {
      filter.reference_type = 'import_batch';
      filter.notes = 'Technology_Skills';
    }

    return filter;
  }

  // ====================================
  // Convenience Methods
  // ====================================

  /**
   * Search occupations by keyword
   */
  async searchOccupations(keyword, limit = 20) {
    return this.query('Occupation', { keyword, limit });
  }

  /**
   * Get occupation by SOC code
   */
  async getOccupation(socCode) {
    return this.query('Occupation', { code: socCode });
  }

  /**
   * Get skills for an occupation
   */
  async getSkillsForOccupation(socCode) {
    return this.query('Skill', { socCode });
  }

  /**
   * Get abilities for an occupation
   */
  async getAbilitiesForOccupation(socCode) {
    return this.query('Ability', { socCode });
  }

  /**
   * Get knowledge areas for an occupation
   */
  async getKnowledgeForOccupation(socCode) {
    return this.query('Knowledge', { socCode });
  }

  /**
   * Get tasks for an occupation
   */
  async getTasksForOccupation(socCode) {
    return this.query('Task', { socCode });
  }

  /**
   * Get interests for an occupation
   */
  async getInterestsForOccupation(socCode) {
    return this.query('Interest', { socCode });
  }

  /**
   * Get work activities for an occupation
   */
  async getWorkActivitiesForOccupation(socCode) {
    return this.query('WorkActivity', { socCode });
  }

  /**
   * Get work context for an occupation
   */
  async getWorkContextForOccupation(socCode) {
    return this.query('WorkContext', { socCode });
  }

  /**
   * Get technology skills for an occupation
   */
  async getTechnologySkillsForOccupation(socCode) {
    return this.query('Technology', { socCode });
  }

  /**
   * Get related occupations
   */
  async getRelatedOccupations(socCode) {
    return this.query('RelatedOccupations', { socCode });
  }

  /**
   * Get complete occupation profile (all data types)
   */
  async getOccupationProfile(socCode) {
    const [
      occupation,
      skills,
      abilities,
      knowledge,
      tasks,
      interests,
      workActivities,
      technology
    ] = await Promise.all([
      this.getOccupation(socCode),
      this.getSkillsForOccupation(socCode),
      this.getAbilitiesForOccupation(socCode),
      this.getKnowledgeForOccupation(socCode),
      this.getTasksForOccupation(socCode),
      this.getInterestsForOccupation(socCode),
      this.getWorkActivitiesForOccupation(socCode),
      this.getTechnologySkillsForOccupation(socCode)
    ]);

    return {
      occupation: occupation.data,
      skills: skills.data,
      abilities: abilities.data,
      knowledge: knowledge.data,
      tasks: tasks.data,
      interests: interests.data,
      workActivities: workActivities.data,
      technology: technology.data,
      sources: {
        occupation: occupation.source,
        skills: skills.source,
        abilities: abilities.source,
        knowledge: knowledge.source,
        tasks: tasks.source,
        interests: interests.source,
        workActivities: workActivities.source,
        technology: technology.source
      }
    };
  }

  /**
   * Get API status
   */
  getApiStatus() {
    return {
      available: this.apiAvailable,
      errorCount: this.apiErrorCount,
      threshold: this.API_ERROR_THRESHOLD,
      lastCheck: this.lastApiCheck,
      willRetryAt: this.lastApiCheck ? this.lastApiCheck + this.API_RETRY_INTERVAL : null
    };
  }
}

// Export singleton instance
export const onetDataService = new ONetDataService();

// Export class for testing
export { ONetDataService };

export default onetDataService;
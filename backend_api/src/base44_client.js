/**
 * Base44 API Client
 * 
 * Provides access to Base44 entities:
 * - JobApplication
 * - Resume
 * - EncouragementQuote
 * - AutofillVault
 * - JobMatch
 * - UserPreferences
 * - Referral
 */

const axios = require('axios');

const BASE44_API_KEY = process.env.BASE44_API_KEY || 'daadd83830f1405a9ed3b8e030da05b4';
const BASE44_APP_ID = process.env.BASE44_APP_ID || '68af4e866eafaf5bc320af8a';
const BASE44_API_URL = process.env.BASE44_API_URL || 'https://app.base44.com/api';

class Base44Client {
  constructor() {
    this.apiKey = BASE44_API_KEY;
    this.appId = BASE44_APP_ID;
    this.baseURL = BASE44_API_URL;
    this.headers = {
      'api_key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  async request(method, path, data = null, params = null) {
    const url = `${this.baseURL}${path}`;
    
    try {
      const config = {
        method,
        url,
        headers: this.headers
      };

      if (method.toUpperCase() === 'GET' && params) {
        config.params = params;
      } else if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`Base44 API Error [${method} ${path}]:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getEntities(entityType, filters = null) {
    return this.request('GET', `/apps/${this.appId}/entities/${entityType}`, null, filters);
  }

  async getEntity(entityType, entityId) {
    return this.request('GET', `/apps/${this.appId}/entities/${entityType}/${entityId}`);
  }

  async createEntity(entityType, data) {
    return this.request('POST', `/apps/${this.appId}/entities/${entityType}`, data);
  }

  async updateEntity(entityType, entityId, data) {
    return this.request('PUT', `/apps/${this.appId}/entities/${entityType}/${entityId}`, data);
  }

  async deleteEntity(entityType, entityId) {
    return this.request('DELETE', `/apps/${this.appId}/entities/${entityType}/${entityId}`);
  }
}

const base44Client = new Base44Client();

const JobApplicationAPI = {
  getAll: (filters) => base44Client.getEntities('JobApplication', filters),
  getById: (id) => base44Client.getEntity('JobApplication', id),
  create: (data) => base44Client.createEntity('JobApplication', data),
  update: (id, data) => base44Client.updateEntity('JobApplication', id, data),
  delete: (id) => base44Client.deleteEntity('JobApplication', id),

  getByStatus: (status) => base44Client.getEntities('JobApplication', { application_status: status }),
  getByCompany: (companyName) => base44Client.getEntities('JobApplication', { company_name: companyName }),
  getPending: () => base44Client.getEntities('JobApplication', { applied: false }),
  getApplied: () => base44Client.getEntities('JobApplication', { applied: true }),
  getRejected: () => base44Client.getEntities('JobApplication', { is_rejected: true })
};

const ResumeAPI = {
  getAll: (filters) => base44Client.getEntities('Resume', filters),
  getById: (id) => base44Client.getEntity('Resume', id),
  create: (data) => base44Client.createEntity('Resume', data),
  update: (id, data) => base44Client.updateEntity('Resume', id, data),
  delete: (id) => base44Client.deleteEntity('Resume', id),

  getMasterResumes: () => base44Client.getEntities('Resume', { is_master_resume: true }),
  getByJobApplication: (jobAppId) => base44Client.getEntities('Resume', { job_application_id: jobAppId }),
  getByVersion: (versionName) => base44Client.getEntities('Resume', { version_name: versionName })
};

const EncouragementQuoteAPI = {
  getAll: (filters) => base44Client.getEntities('EncouragementQuote', filters),
  getById: (id) => base44Client.getEntity('EncouragementQuote', id),
  create: (data) => base44Client.createEntity('EncouragementQuote', data),
  update: (id, data) => base44Client.updateEntity('EncouragementQuote', id, data),
  delete: (id) => base44Client.deleteEntity('EncouragementQuote', id),

  getApproved: () => base44Client.getEntities('EncouragementQuote', { approved: true }),
  getByTag: (tag) => base44Client.getEntities('EncouragementQuote', { tags: tag }),
  getRandom: async () => {
    const quotes = await base44Client.getEntities('EncouragementQuote', { approved: true });
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
};

const AutofillVaultAPI = {
  getAll: (filters) => base44Client.getEntities('AutofillVault', filters),
  getById: (id) => base44Client.getEntity('AutofillVault', id),
  create: (data) => base44Client.createEntity('AutofillVault', data),
  update: (id, data) => base44Client.updateEntity('AutofillVault', id, data),
  delete: (id) => base44Client.deleteEntity('AutofillVault', id),

  getPersonalInfo: async (id) => {
    const vault = await base44Client.getEntity('AutofillVault', id);
    return vault.personal;
  },
  getWorkHistory: async (id) => {
    const vault = await base44Client.getEntity('AutofillVault', id);
    return vault.work_history;
  },
  getEducation: async (id) => {
    const vault = await base44Client.getEntity('AutofillVault', id);
    return vault.education;
  }
};

const JobMatchAPI = {
  getAll: (filters) => base44Client.getEntities('JobMatch', filters),
  getById: (id) => base44Client.getEntity('JobMatch', id),
  create: (data) => base44Client.createEntity('JobMatch', data),
  update: (id, data) => base44Client.updateEntity('JobMatch', id, data),
  delete: (id) => base44Client.deleteEntity('JobMatch', id),

  getByStatus: (status) => base44Client.getEntities('JobMatch', { status }),
  getByResumeId: (resumeId) => base44Client.getEntities('JobMatch', { resume_id: resumeId }),
  getAutoMatched: () => base44Client.getEntities('JobMatch', { auto_matched: true }),
  getHighScores: (minScore = 80) => base44Client.getEntities('JobMatch', { match_score: `>=${minScore}` })
};

const UserPreferencesAPI = {
  getAll: (filters) => base44Client.getEntities('UserPreferences', filters),
  getById: (id) => base44Client.getEntity('UserPreferences', id),
  create: (data) => base44Client.createEntity('UserPreferences', data),
  update: (id, data) => base44Client.updateEntity('UserPreferences', id, data),
  delete: (id) => base44Client.deleteEntity('UserPreferences', id),

  getCareerGoals: async (id) => {
    const prefs = await base44Client.getEntity('UserPreferences', id);
    return prefs.career_goals;
  },
  getTargetRoles: async (id) => {
    const prefs = await base44Client.getEntity('UserPreferences', id);
    return prefs.target_roles;
  }
};

const ReferralAPI = {
  getAll: (filters) => base44Client.getEntities('Referral', filters),
  getById: (id) => base44Client.getEntity('Referral', id),
  create: (data) => base44Client.createEntity('Referral', data),
  update: (id, data) => base44Client.updateEntity('Referral', id, data),
  delete: (id) => base44Client.deleteEntity('Referral', id),

  getByReferrerEmail: (email) => base44Client.getEntities('Referral', { referrer_email: email }),
  getByReferralCode: (code) => base44Client.getEntities('Referral', { referral_code: code }),
  getByStatus: (status) => base44Client.getEntities('Referral', { status })
};

module.exports = {
  base44Client,
  JobApplicationAPI,
  ResumeAPI,
  EncouragementQuoteAPI,
  AutofillVaultAPI,
  JobMatchAPI,
  UserPreferencesAPI,
  ReferralAPI
};

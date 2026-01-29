const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Determine headers. If body is FormData, let browser set Content-Type
    const headers = { ...options.headers };
    
    // Add JWT token if available
    const token = localStorage.getItem('prague_day_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    // Check if data is FormData
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(endpoint, {
      method: 'POST',
      body
    });
  }

  async put(endpoint, data) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(endpoint, {
      method: 'PUT',
      body
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new APIClient();

export const resumeAPI = {
  parse: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/resume/parse', formData);
  },

  analyze: async (resumeData, jobDescription) => {
    return apiClient.post('/api/resume/analyze', {
      resumeData,
      jobDescription
    });
  },

  optimize: async (resumeData, jobDescription, targetRole) => {
    return apiClient.post('/api/resume/optimize', {
      resumeData,
      jobDescription,
      targetRole
    });
  },

  getAll: async (filters) => apiClient.get(`/api/data/resumes${filters ? '?' + new URLSearchParams(filters) : ''}`),
  getById: async (id) => apiClient.get(`/api/data/resumes/${id}`),
  create: async (data) => apiClient.post('/api/data/resumes', data),
  update: async (id, data) => apiClient.put(`/api/data/resumes/${id}`, data),
  delete: async (id) => apiClient.delete(`/api/data/resumes/${id}`)
};

export const jobAPI = {
  analyze: async (jobDescription, candidateContext = null) => {
    return apiClient.post('/api/job/analyze', {
      jobDescription,
      candidateContext
    });
  },

  assessFit: async (resumeData, jobDescription) => {
    return apiClient.post('/api/job/assess-fit', {
      resumeData,
      jobDescription
    });
  }
};

export const jobApplicationAPI = {
  getAll: async (filters) => apiClient.get(`/api/data/job-applications${filters ? '?' + new URLSearchParams(filters) : ''}`),
  getById: async (id) => apiClient.get(`/api/data/job-applications/${id}`),
  create: async (data) => apiClient.post('/api/data/job-applications', data),
  update: async (id, data) => apiClient.put(`/api/data/job-applications/${id}`, data),
  delete: async (id) => apiClient.delete(`/api/data/job-applications/${id}`),

  getByStatus: async (status) => apiClient.get(`/api/data/job-applications?application_status=${status}`),
  getPending: async () => apiClient.get('/api/data/job-applications?applied=false'),
  getApplied: async () => apiClient.get('/api/data/job-applications?applied=true'),
  getRejected: async () => apiClient.get('/api/data/job-applications?is_rejected=true')
};

export const coverLetterAPI = {
  generate: async (resumeData, jobDescription, companyName, options = {}) => {
    return apiClient.post('/api/cover-letter/generate', {
      resumeData,
      jobDescription,
      companyName,
      options
    });
  }
};

export const interviewAPI = {
  prepare: async (resumeData, jobDescription, questionType = 'behavioral') => {
    return apiClient.post('/api/interview/prepare', {
      resumeData,
      jobDescription,
      questionType
    });
  },

  answerQuestions: async (resumeData, jobDescription, questions) => {
    return apiClient.post('/api/interview/answer-questions', {
      resumeData,
      jobDescription,
      questions
    });
  }
};

export const quotesAPI = {
  getAll: async () => apiClient.get('/api/data/quotes'),
  getRandom: async () => apiClient.get('/api/data/quotes/random')
};

export const autofillVaultAPI = {
  getAll: async (filters) => apiClient.get(`/api/data/autofill-vault${filters ? '?' + new URLSearchParams(filters) : ''}`),
  getById: async (id) => apiClient.get(`/api/data/autofill-vault/${id}`),
  create: async (data) => apiClient.post('/api/data/autofill-vault', data),
  update: async (id, data) => apiClient.put(`/api/data/autofill-vault/${id}`, data)
};

export const jobMatchAPI = {
  getAll: async (filters) => apiClient.get(`/api/data/job-matches${filters ? '?' + new URLSearchParams(filters) : ''}`),
  getById: async (id) => apiClient.get(`/api/data/job-matches/${id}`),
  create: async (data) => apiClient.post('/api/data/job-matches', data),
  update: async (id, data) => apiClient.put(`/api/data/job-matches/${id}`, data),

  getByStatus: async (status) => apiClient.get(`/api/data/job-matches?status=${status}`),
  getHighScores: async (minScore = 80) => apiClient.get(`/api/data/job-matches?match_score=>=${minScore}`)
};

export const userPreferencesAPI = {
  getAll: async (filters) => apiClient.get(`/api/data/user-preferences${filters ? '?' + new URLSearchParams(filters) : ''}`),
  getById: async (id) => apiClient.get(`/api/data/user-preferences/${id}`),
  create: async (data) => apiClient.post('/api/data/user-preferences', data),
  update: async (id, data) => apiClient.put(`/api/data/user-preferences/${id}`, data)
};

export const referralAPI = {
  getAll: async (filters) => apiClient.get(`/api/data/referrals${filters ? '?' + new URLSearchParams(filters) : ''}`),
  getById: async (id) => apiClient.get(`/api/data/referrals/${id}`),
  create: async (data) => apiClient.post('/api/data/referrals', data),
  update: async (id, data) => apiClient.put(`/api/data/referrals/${id}`, data),

  getByReferrerEmail: async (email) => apiClient.get(`/api/data/referrals?referrer_email=${email}`),
  getByReferralCode: async (code) => apiClient.get(`/api/data/referrals?referral_code=${code}`)
};

export const healthAPI = {
  check: async () => {
    return apiClient.get('/');
  }
};

export default apiClient;

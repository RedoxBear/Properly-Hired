require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { Readable } = require('stream');
const axios = require('axios');

// Base44 configuration
const BASE44_API_KEY = process.env.BASE44_API_KEY || 'daadd83830f1405a9ed3b8e030da05b4';
const BASE44_APP_ID = process.env.BASE44_APP_ID || '68af4e866eafaf5bc320af8a';
const BASE44_API_URL = process.env.BASE44_API_URL || 'https://app.base44.com/api';

// Base44 API helper
const base44Request = async (method, entityType, data = null) => {
  const url = `${BASE44_API_URL}/apps/${BASE44_APP_ID}/entities/${entityType}`;

  try {
    const config = {
      method,
      url,
      headers: {
        'api_key': BASE44_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`[Base44 API Error] ${error.response?.status}: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

// Configuration
const BATCH_SIZE = 100; // Larger batches for server-side
const BATCH_DELAY_MS = 500; // Shorter delay on server
const REQUEST_DELAY_MS = 50; // Shorter delay between requests
const MAX_RETRIES = 5;

// File to entity mapping
const FILE_TO_ENTITY_MAP = {
  'Occupation_Data': 'ONetOccupation',
  'Occupation Data': 'ONetOccupation',
  'Skills': 'ONetSkill',
  'Abilities': 'ONetAbility',
  'Knowledge': 'ONetKnowledge',
  'Task_Statements': 'ONetTask',
  'Task Statements': 'ONetTask',
  'Work_Activities': 'ONetWorkActivity',
  'Work Activities': 'ONetWorkActivity',
  'Work_Context': 'ONetWorkContext',
  'Work Context': 'ONetWorkContext',
  'Content_Model_Reference': 'ONetReference',
  'Content Model Reference': 'ONetReference'
};

// Import job storage (in-memory for now, should be persisted)
const importJobs = new Map();

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createRecordWithRetry = async (entityName, record, maxRetries = MAX_RETRIES) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await base44Request('POST', entityName, record);
      return { success: true };
    } catch (error) {
      const isRateLimitError =
        error.response?.status === 429 ||
        error.message?.includes('Rate limit') ||
        error.message?.includes('429') ||
        error.message?.includes('Too Many Requests');

      if (isRateLimitError && attempt < maxRetries) {
        const backoffDelay = Math.pow(2, attempt) * 1000;
        console.log(`Rate limit hit, retrying in ${backoffDelay}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(backoffDelay);
        continue;
      }
      return { success: false, error: error.message || 'Unknown error' };
    }
  }
  return { success: false, error: 'Max retries exceeded' };
};

const parseCSVBuffer = async (buffer) => {
  return new Promise((resolve, reject) => {
    const records = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on('data', (row) => records.push(row))
      .on('end', () => resolve(records))
      .on('error', (error) => reject(error));
  });
};

const detectEntityName = (fileName) => {
  for (const [pattern, entityName] of Object.entries(FILE_TO_ENTITY_MAP)) {
    if (fileName.includes(pattern)) {
      return entityName;
    }
  }
  return null;
};

// Main import function
const importONetFile = async (jobId, fileName, fileBuffer, onProgress) => {
  const job = importJobs.get(jobId);
  if (!job) throw new Error('Job not found');

  try {
    // Update job status
    job.status = 'parsing';
    job.currentFile = fileName;
    if (onProgress) onProgress(job);

    // Detect entity
    const entityName = detectEntityName(fileName);
    if (!entityName) {
      throw new Error(`Cannot map file ${fileName} to any O*NET entity`);
    }

    job.entityName = entityName;
    if (onProgress) onProgress(job);

    // Parse CSV
    const records = await parseCSVBuffer(fileBuffer);
    job.totalRecords = records.length;
    job.status = 'importing';
    if (onProgress) onProgress(job);

    // Import records in batches
    let importedCount = 0;
    let failedCount = 0;
    const failedRecords = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      if (job.cancelled) {
        job.status = 'cancelled';
        if (onProgress) onProgress(job);
        break;
      }

      const batch = records.slice(i, i + BATCH_SIZE);

      // Process batch records
      for (let j = 0; j < batch.length; j++) {
        const record = batch[j];
        const result = await createRecordWithRetry(entityName, record);

        if (result.success) {
          importedCount++;
        } else {
          failedCount++;
          failedRecords.push({
            index: i + j,
            record,
            error: result.error
          });
        }

        // Small delay between records
        await sleep(REQUEST_DELAY_MS);
      }

      // Update progress
      job.importedCount = importedCount;
      job.failedCount = failedCount;
      job.progress = Math.round((importedCount / records.length) * 100);
      if (onProgress) onProgress(job);

      // Delay between batches
      if (i + BATCH_SIZE < records.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    // Finalize job
    job.status = job.cancelled ? 'cancelled' : 'completed';
    job.completedAt = new Date().toISOString();
    job.failedRecords = failedRecords.slice(0, 100); // Keep first 100 failures
    if (onProgress) onProgress(job);

    return job;

  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    if (onProgress) onProgress(job);
    throw error;
  }
};

// Batch import multiple files
const importONetBatch = async (jobId, files, onProgress) => {
  const job = importJobs.get(jobId);
  if (!job) throw new Error('Job not found');

  job.totalFiles = files.length;
  job.currentFileIndex = 0;

  for (const file of files) {
    if (job.cancelled) break;

    try {
      await importONetFile(jobId, file.originalname, file.buffer, onProgress);
      job.currentFileIndex++;
    } catch (error) {
      console.error(`Failed to import ${file.originalname}:`, error.message);
      job.fileErrors = job.fileErrors || [];
      job.fileErrors.push({
        fileName: file.originalname,
        error: error.message
      });
    }
  }

  job.status = 'completed';
  job.completedAt = new Date().toISOString();
  if (onProgress) onProgress(job);

  return job;
};

// Job management
const createImportJob = (userId, type = 'single') => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const job = {
    id: jobId,
    userId,
    type,
    status: 'pending',
    createdAt: new Date().toISOString(),
    progress: 0,
    importedCount: 0,
    failedCount: 0,
    totalRecords: 0,
    cancelled: false
  };
  importJobs.set(jobId, job);
  return job;
};

const getImportJob = (jobId) => {
  return importJobs.get(jobId);
};

const cancelImportJob = (jobId) => {
  const job = importJobs.get(jobId);
  if (job) {
    job.cancelled = true;
    job.status = 'cancelled';
  }
  return job;
};

const listImportJobs = (userId) => {
  return Array.from(importJobs.values())
    .filter(job => job.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

module.exports = {
  importONetFile,
  importONetBatch,
  createImportJob,
  getImportJob,
  cancelImportJob,
  listImportJobs,
  FILE_TO_ENTITY_MAP
};

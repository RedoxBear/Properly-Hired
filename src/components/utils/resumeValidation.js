/**
 * Resume validation utilities for tier limits and duplicate detection
 */

import { base44 } from "@/api/base44Client";
import { TIER_LIMITS } from "./accessControl";

/**
 * Generate a simple hash of resume content for duplicate detection
 * Uses the text content of experience, education, and skills sections
 */
export function generateResumeContentHash(parsedContent) {
  try {
    const content = typeof parsedContent === 'string' ? JSON.parse(parsedContent) : parsedContent;

    // Extract key identifying content
    const experience = (content.experience || [])
      .map(exp => {
        const achievements = (exp.achievements || []).join(' ').toLowerCase().trim();
        return `${exp.position}|${exp.company}|${achievements}`;
      })
      .join('||');

    const education = (content.education || [])
      .map(edu => `${edu.degree}|${edu.institution}`)
      .join('||');

    const skills = (content.skills || []).join(',').toLowerCase().trim();

    const summary = (content.summary || content.executive_summary || '').toLowerCase().trim();

    // Combine all content
    const fullContent = `${experience}||${education}||${skills}||${summary}`;

    // Simple hash function (FNV-1a)
    let hash = 2166136261;
    for (let i = 0; i < fullContent.length; i++) {
      hash ^= fullContent.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    return (hash >>> 0).toString(36);
  } catch (error) {
    console.error("Error generating resume hash:", error);
    return null;
  }
}

/**
 * Calculate similarity between two resume content strings
 * Returns a score from 0-100 indicating similarity
 */
export function calculateContentSimilarity(content1, content2) {
  try {
    const parsed1 = typeof content1 === 'string' ? JSON.parse(content1) : content1;
    const parsed2 = typeof content2 === 'string' ? JSON.parse(content2) : content2;

    let matchScore = 0;
    let totalChecks = 0;

    // Compare experience sections
    const exp1 = (parsed1.experience || []);
    const exp2 = (parsed2.experience || []);

    if (exp1.length > 0 && exp2.length > 0) {
      totalChecks++;

      // Check if same companies and positions exist
      const jobs1 = exp1.map(e => `${e.company}|${e.position}`.toLowerCase());
      const jobs2 = exp2.map(e => `${e.company}|${e.position}`.toLowerCase());

      const commonJobs = jobs1.filter(j => jobs2.includes(j)).length;
      const maxJobs = Math.max(jobs1.length, jobs2.length);

      if (commonJobs / maxJobs > 0.7) matchScore += 30;

      // Check achievement text similarity
      const achievements1 = exp1.flatMap(e => e.achievements || []).join(' ').toLowerCase();
      const achievements2 = exp2.flatMap(e => e.achievements || []).join(' ').toLowerCase();

      const words1 = achievements1.split(/\s+/).filter(w => w.length > 4);
      const words2 = achievements2.split(/\s+/).filter(w => w.length > 4);

      if (words1.length > 0 && words2.length > 0) {
        const commonWords = words1.filter(w => words2.includes(w)).length;
        const matchRate = commonWords / Math.max(words1.length, words2.length);

        if (matchRate > 0.6) matchScore += 40;
      }
    }

    // Compare education sections
    const edu1 = (parsed1.education || []);
    const edu2 = (parsed2.education || []);

    if (edu1.length > 0 && edu2.length > 0) {
      totalChecks++;
      const eduStr1 = edu1.map(e => `${e.degree}|${e.institution}`.toLowerCase()).join('|');
      const eduStr2 = edu2.map(e => `${e.degree}|${e.institution}`.toLowerCase()).join('|');

      if (eduStr1 === eduStr2) matchScore += 15;
    }

    // Compare skills
    const skills1 = (parsed1.skills || []).map(s => s.toLowerCase());
    const skills2 = (parsed2.skills || []).map(s => s.toLowerCase());

    if (skills1.length > 0 && skills2.length > 0) {
      totalChecks++;
      const commonSkills = skills1.filter(s => skills2.includes(s)).length;
      const maxSkills = Math.max(skills1.length, skills2.length);

      if (commonSkills / maxSkills > 0.7) matchScore += 15;
    }

    return matchScore;
  } catch (error) {
    console.error("Error calculating similarity:", error);
    return 0;
  }
}

/**
 * Check if a resume with similar content already exists for a different user
 * @returns {Promise<{isDuplicate: boolean, existingUser?: string, similarity?: number}>}
 */
export async function checkForDuplicateResume(parsedContent, currentUserId) {
  try {
    const currentUser = await base44.auth.me();

    // Get all resumes from the database
    const Resume = base44.entities.Resume;
    const allResumes = await Resume.list("-created_date", 500);

    // Generate hash for the new resume
    const newHash = generateResumeContentHash(parsedContent);
    if (!newHash) return { isDuplicate: false };

    // Check each resume
    for (const resume of allResumes) {
      // Skip resumes belonging to current user
      if (resume.created_by === currentUser.id) continue;

      try {
        const existingContent = resume.parsed_content || resume.optimized_content;
        if (!existingContent) continue;

        const existingHash = generateResumeContentHash(existingContent);

        // If hashes match, check detailed similarity
        if (existingHash === newHash) {
          const similarity = calculateContentSimilarity(parsedContent, existingContent);

          // If similarity is high (>= 75%), flag as duplicate
          if (similarity >= 75) {
            return {
              isDuplicate: true,
              existingUser: resume.created_by,
              similarity: similarity,
              resumeId: resume.id
            };
          }
        }
      } catch (error) {
        console.error("Error checking resume:", resume.id, error);
        continue;
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("Error in duplicate check:", error);
    return { isDuplicate: false };
  }
}

/**
 * Check if user can create more resumes based on their tier limits
 * @returns {Promise<{canCreate: boolean, current: number, limit: number, tier: string}>}
 */
export async function checkResumeLimit() {
  try {
    const user = await base44.auth.me();
    const tier = user.subscription_tier || 'free';
    const limits = TIER_LIMITS[tier];

    if (!limits) {
      return { canCreate: true, current: 0, limit: -1, tier };
    }

    const maxResumes = limits.max_resumes;

    // If unlimited (-1), allow creation
    if (maxResumes === -1) {
      return { canCreate: true, current: 0, limit: -1, tier };
    }

    // Count current resumes (only master resumes count towards limit)
    const Resume = base44.entities.Resume;
    const userResumes = await Resume.filter({ is_master_resume: true }, "-created_date", 1000);
    const currentCount = userResumes.length;

    return {
      canCreate: currentCount < maxResumes,
      current: currentCount,
      limit: maxResumes,
      tier
    };
  } catch (error) {
    console.error("Error checking resume limit:", error);
    return { canCreate: true, current: 0, limit: -1, tier: 'free' };
  }
}

/**
 * Check if user is approaching their tier limit (within 1 of limit)
 * @returns {Promise<boolean>}
 */
export async function isApproachingLimit() {
  try {
    const limitCheck = await checkResumeLimit();

    if (limitCheck.limit === -1) return false; // Unlimited

    return (limitCheck.current >= limitCheck.limit - 1);
  } catch (error) {
    console.error("Error checking if approaching limit:", error);
    return false;
  }
}

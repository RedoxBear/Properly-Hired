import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  WidthType,
} from 'npm:docx@8';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResumeSection {
  type: 'summary' | 'experience' | 'skills' | 'education' | 'certifications' | 'other';
  heading: string;
  content: string[];
}

interface ParsedResume {
  name: string;
  contact: string;
  sections: ResumeSection[];
}

interface AuditResult {
  passed: boolean;
  ghost_strings: string[];
  meta_issues: string[];
  section_parse: Record<string, boolean>;
  ats_score: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the','and','or','of','in','a','an','to','for','with','on','at','by','is','are','be',
  'was','were','has','have','this','that','which','from','as','it','its','we','our',
  'you','your','their','will','can','may','should','must','not','no','if','but','so',
  'than','then','when','where','how','what','who','they','them','these','those','been',
  'being','had','do','does','did','would','could','shall','about','above','after',
  'before','during','through','via','per','etc',
]);

const HR_TERMS = new Set([
  'hris','ats','onboarding','offboarding','payroll','compliance','dei','erp','workday',
  'successfactors','adp','bamboohr','greenhouse','lever','kpi','okr','sla','fmla',
  'cobra','erisa','flsa','shrm','phr','sphr','hrci','soc','sox','gdpr','ccpa','pip',
  'eeo','ada','nlrb',
]);

const SECTION_PATTERNS: Array<{ type: ResumeSection['type']; regex: RegExp }> = [
  { type: 'summary',        regex: /^(professional\s+)?summary|profile|objective|about/i },
  { type: 'experience',     regex: /experience|employment|work\s+history|career/i },
  { type: 'skills',         regex: /skills|competencies|expertise|technologies|tools/i },
  { type: 'education',      regex: /education|academic|degree|university|college/i },
  { type: 'certifications', regex: /certif|licens|accredit|credential/i },
];

// ─── Helper: extractKeywords ───────────────────────────────────────────────────

function extractKeywords(text: string): Set<string> {
  const cleaned = text.replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = cleaned.split(/\s+/);
  const result = new Set<string>();
  for (const word of words) {
    const lower = word.toLowerCase();
    if (lower.length > 2 && !STOPWORDS.has(lower)) {
      result.add(lower);
    }
  }
  return result;
}

// ─── Helper: findKeywordGaps ──────────────────────────────────────────────────

function findKeywordGaps(jdText: string, resumeText: string): string[] {
  const resumeKeywords = extractKeywords(resumeText);

  // Count keyword frequencies in JD
  const jdLower = jdText.toLowerCase();
  const jdWords = jdLower.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/);
  const freq: Map<string, number> = new Map();
  for (const word of jdWords) {
    if (word.length > 2 && !STOPWORDS.has(word)) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }

  const gaps: string[] = [];
  for (const [kw, count] of freq.entries()) {
    if (resumeKeywords.has(kw)) continue;
    if (count >= 2 || HR_TERMS.has(kw)) {
      gaps.push(kw);
    }
  }

  // Sort by frequency descending, then return top 15
  gaps.sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));
  return gaps.slice(0, 15);
}

// ─── Helper: scoreATSCompliance ───────────────────────────────────────────────

function scoreATSCompliance(resumeText: string, jdText: string): number {
  const resumeKeywords = extractKeywords(resumeText);
  const jdKeywords = extractKeywords(jdText);
  if (jdKeywords.size === 0) return 40;

  let overlap = 0;
  for (const kw of jdKeywords) {
    if (resumeKeywords.has(kw)) overlap++;
  }

  const overlapRate = overlap / jdKeywords.size;
  return Math.min(100, Math.round(40 + overlapRate * 60));
}

// ─── Helper: parseResumeText ──────────────────────────────────────────────────

function parseResumeText(text: string): ParsedResume {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { name: '', contact: '', sections: [] };

  const name = lines[0] ?? '';

  // Lines 1-4: detect contact info
  const contactLines: string[] = [];
  for (let i = 1; i <= Math.min(4, lines.length - 1); i++) {
    const line = lines[i];
    if (/@/.test(line) || /\+?[\d\s\-().]{7,}/.test(line) || /linkedin/i.test(line)) {
      contactLines.push(line);
    }
  }
  const contact = contactLines.join(' | ');

  // Determine which line to start parsing sections from
  const sectionStartIdx = contactLines.length > 0
    ? 1 + contactLines.length
    : 1;

  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;

  for (let i = sectionStartIdx; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a section header
    const isSectionHeader = line.length < 50;
    let matchedType: ResumeSection['type'] | null = null;

    if (isSectionHeader) {
      for (const pat of SECTION_PATTERNS) {
        if (pat.regex.test(line)) {
          matchedType = pat.type;
          break;
        }
      }
    }

    if (matchedType !== null) {
      if (currentSection) sections.push(currentSection);
      currentSection = { type: matchedType, heading: line, content: [] };
    } else {
      if (currentSection) {
        currentSection.content.push(line);
      } else {
        // Pre-section content — create an 'other' bucket
        currentSection = { type: 'other', heading: 'ADDITIONAL', content: [line] };
      }
    }
  }

  if (currentSection) sections.push(currentSection);

  return { name, contact, sections };
}

// ─── Helper: injectKeywordsIntoResume ─────────────────────────────────────────

function injectKeywordsIntoResume(
  parsed: ParsedResume,
  gapKeywords: string[],
  _jdText: string,
): ParsedResume {
  // Deep clone
  const cloned: ParsedResume = {
    name: parsed.name,
    contact: parsed.contact,
    sections: parsed.sections.map((s) => ({ ...s, content: [...s.content] })),
  };

  const skillsIdx = cloned.sections.findIndex((s) => s.type === 'skills');
  const summaryIdx = cloned.sections.findIndex((s) => s.type === 'summary');

  if (skillsIdx >= 0) {
    const skillsSection = cloned.sections[skillsIdx];
    const existingText = skillsSection.content.join(' ').toLowerCase();
    const newKeywords = gapKeywords.filter((kw) => !existingText.includes(kw));
    if (newKeywords.length > 0) {
      skillsSection.content.push(newKeywords.map((kw) => capitalize(kw)).join(' · '));
    }
  } else {
    // Insert skills section at index 1
    const newSkills: ResumeSection = {
      type: 'skills',
      heading: 'CORE COMPETENCIES',
      content: [gapKeywords.map((kw) => capitalize(kw)).join(' · ')],
    };
    cloned.sections.splice(1, 0, newSkills);
  }

  // Summary injection
  const adjustedSummaryIdx = summaryIdx >= 0
    ? cloned.sections.findIndex((s) => s.type === 'summary')
    : -1;

  if (adjustedSummaryIdx >= 0) {
    const summarySection = cloned.sections[adjustedSummaryIdx];
    if (summarySection.content.length > 0) {
      const top3gaps = gapKeywords.slice(0, 3).map((kw) => capitalize(kw));
      const lastSentence = summarySection.content[summarySection.content.length - 1].toLowerCase();
      const alreadyMentioned = top3gaps.every((kw) => lastSentence.includes(kw.toLowerCase()));
      if (!alreadyMentioned && top3gaps.length > 0) {
        summarySection.content.push(`Proven expertise in ${top3gaps.join(', ')}.`);
      }
    }
  }

  return cloned;
}

// ─── Helper: auditDocumentStructure ──────────────────────────────────────────

function auditDocumentStructure(parsed: ParsedResume): AuditResult {
  const metaIssues: string[] = [];
  const ghostStrings: string[] = [];
  const sectionParse: Record<string, boolean> = {};

  const hasExperience = parsed.sections.some((s) => s.type === 'experience');
  const hasSkills = parsed.sections.some((s) => s.type === 'skills');

  if (!hasExperience) metaIssues.push('no_experience_section');
  if (!hasSkills) metaIssues.push('no_skills_section');

  for (const section of parsed.sections) {
    const isEmpty = section.content.length === 0;
    if (isEmpty) metaIssues.push(`empty_section:${section.type}`);
    sectionParse[section.type] = !isEmpty;

    if (section.type === 'skills') {
      for (const line of section.content) {
        if (line.length > 200) {
          ghostStrings.push(line.substring(0, 80) + '…');
        }
      }
    }
  }

  const passed = metaIssues.length === 0 && ghostStrings.length === 0;

  return {
    passed,
    ghost_strings: ghostStrings,
    meta_issues: metaIssues,
    section_parse: sectionParse,
    ats_score: 0, // caller will set this
  };
}

// ─── Helper: buildStandardDocx ───────────────────────────────────────────────

function buildStandardDocx(
  parsed: ParsedResume,
  candidateName: string,
  targetRole: string,
  top3Skills: string[],
): Document {
  const children: Paragraph[] = [];

  // Name paragraph
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: parsed.name || candidateName,
          bold: true,
          size: 48,
          color: '1A3656',
          font: 'Calibri',
        }),
      ],
    }),
  );

  // Contact paragraph
  if (parsed.contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: parsed.contact,
            size: 18,
            color: '444444',
            font: 'Calibri',
          }),
        ],
      }),
    );
  }

  // Divider
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: {
          color: '0070C0',
          size: 6,
          style: BorderStyle.SINGLE,
        },
      },
      children: [],
    }),
  );

  // Sections
  for (const section of parsed.sections) {
    // Section heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
        border: {
          bottom: {
            color: 'E0E0E0',
            size: 2,
            style: BorderStyle.SINGLE,
          },
        },
        children: [
          new TextRun({
            text: section.heading.toUpperCase(),
            bold: true,
            size: 22,
            color: '0070C0',
            font: 'Calibri',
          }),
        ],
      }),
    );

    // Content lines
    for (const line of section.content) {
      const isBullet = /^[•\-*]/.test(line.trim());
      const lineText = isBullet ? line.replace(/^[•\-*]\s*/, '') : line;

      children.push(
        new Paragraph({
          bullet: isBullet ? { level: 0 } : undefined,
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: lineText,
              size: 20,
              font: 'Calibri',
            }),
          ],
        }),
      );
    }
  }

  return new Document({
    creator: candidateName,
    title: `${candidateName} - Resume`,
    subject: targetRole,
    keywords: top3Skills.join(', '),
    description: '',
    lastModifiedBy: candidateName,
    revision: 1,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 1008,
              bottom: 720,
              left: 1008,
            },
          },
        },
        children,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 20,
          },
        },
      },
    },
  });
}

// ─── Helper: generateCoverLetter ─────────────────────────────────────────────

function generateCoverLetter(
  parsed: ParsedResume,
  jobListing: { title?: string; company?: string },
  gapKeywordsFilled: string[],
): string {
  const role = jobListing.title ?? 'the position';
  const company = jobListing.company ?? 'your organization';

  const summarySection = parsed.sections.find((s) => s.type === 'summary');
  const summaryText = summarySection?.content.join(' ') ?? '';

  const expSection = parsed.sections.find((s) => s.type === 'experience');
  const firstExpLine = expSection?.content.find((l) => l.trim().length > 0) ?? '';

  const top3 = gapKeywordsFilled.slice(0, 3).map((kw) => capitalize(kw));
  const top5 = gapKeywordsFilled.slice(0, 5).map((kw) => capitalize(kw));

  const para1Parts = [`I am writing to express my strong interest in the ${role} position at ${company}.`];
  if (summaryText) {
    para1Parts.push(summaryText);
  }
  const para1 = para1Parts.join(' ');

  const para2Parts: string[] = [];
  if (top3.length > 0) {
    para2Parts.push(
      `Throughout my career, I have developed deep expertise in ${top3.join(', ')}, which directly aligns with the requirements of this role.`,
    );
  }
  if (firstExpLine) {
    para2Parts.push(`In my recent experience, ${firstExpLine.toLowerCase()}.`);
  }
  const para2 = para2Parts.join(' ') || 'My professional background has equipped me with the skills and experience needed to excel in this position.';

  const para3 =
    top5.length > 0
      ? `I bring proven strengths in ${top5.join(', ')}, and I am excited about the opportunity to contribute to ${company}. Thank you for considering my application — I look forward to discussing how I can add value to your team.`
      : `I am eager to bring my skills and dedication to ${company} and would welcome the opportunity to discuss my qualifications further. Thank you for your time and consideration.`;

  return [para1, '', para2, '', para3, '', `Sincerely,\n${parsed.name}`].join('\n');
}

// ─── Helper: uint8ToBase64 ────────────────────────────────────────────────────

function uint8ToBase64(u8: Uint8Array): string {
  let b = '';
  for (let i = 0; i < u8.length; i++) {
    b += String.fromCharCode(u8[i]);
  }
  return btoa(b);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function resumeToText(parsed: ParsedResume): string {
  const parts: string[] = [parsed.name, parsed.contact];
  for (const section of parsed.sections) {
    parts.push(section.heading);
    parts.push(...section.content);
  }
  return parts.join('\n');
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { user_id = user.id, job_listing_id, format = 'standard' } = body;

    if (!job_listing_id) {
      return Response.json({ error: 'job_listing_id is required' }, { status: 400 });
    }

    // Load entities
    const JobListing = base44.asServiceRole.entities.JobListing;
    const Resume = base44.asServiceRole.entities.Resume;
    const ResumeVersion = base44.asServiceRole.entities.ResumeVersion;

    // Load job listing — try direct get first, fallback to filter
    let jobListing: Record<string, unknown> | null = null;
    try {
      const direct = await JobListing.get(job_listing_id);
      jobListing = direct ?? null;
    } catch {
      const listings = await JobListing.filter({ id: job_listing_id }).catch(() => []);
      jobListing = listings?.[0] ?? null;
    }
    if (!jobListing) {
      return Response.json({ error: 'Job listing not found' }, { status: 404 });
    }

    // Load master resume
    const resumes = await Resume.filter({ user_id });
    const masterResume = resumes?.find((r: Record<string, unknown>) => r.is_master_resume) ?? resumes?.[0] ?? null;
    if (!masterResume) {
      return Response.json({ error: 'No master resume found for user' }, { status: 400 });
    }

    const masterText: string = (masterResume.parsed_content ?? masterResume.optimized_content ?? '') as string;
    const jdText: string = (jobListing.jd_text ?? '') as string;
    const personalInfo = (masterResume.personal_info ?? {}) as Record<string, string>;
    const candidateName: string = (personalInfo.name ?? user.full_name ?? user.email ?? 'Candidate') as string;
    const targetRole: string = (jobListing.title ?? jobListing.job_title ?? 'Professional') as string;

    // ── Round 1 ──────────────────────────────────────────────────────────────
    let parsed = parseResumeText(masterText);
    let gapKeywords = findKeywordGaps(jdText, masterText);
    let tailored = injectKeywordsIntoResume(parsed, gapKeywords, jdText);
    let tailoredText = resumeToText(tailored);
    let atsScore = scoreATSCompliance(tailoredText, jdText);
    let round = 1;

    console.log(`[orchestrateTailoring] Round 1 — ATS: ${atsScore}, gaps: ${gapKeywords.length}`);

    // ── Round 2 (if score < 75) ───────────────────────────────────────────────
    if (atsScore < 75) {
      const round2Gaps = findKeywordGaps(jdText, tailoredText);
      if (round2Gaps.length > 0) {
        tailored = injectKeywordsIntoResume(tailored, round2Gaps, jdText);
        tailoredText = resumeToText(tailored);
        atsScore = scoreATSCompliance(tailoredText, jdText);
        // Merge gap lists (deduplicated)
        const merged = [...new Set([...gapKeywords, ...round2Gaps])];
        gapKeywords = merged;
        round = 2;
        console.log(`[orchestrateTailoring] Round 2 — ATS: ${atsScore}, gaps: ${gapKeywords.length}`);
      }
    }

    // Extract top 3 skills from skills section
    const skillsSection = tailored.sections.find((s) => s.type === 'skills');
    let top3Skills: string[] = [];
    if (skillsSection && skillsSection.content.length > 0) {
      top3Skills = skillsSection.content
        .join(' ')
        .split(/[·,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 3);
    }
    if (top3Skills.length === 0) {
      top3Skills = gapKeywords.slice(0, 3).map(capitalize);
    }

    // Build DOCX
    const doc = buildStandardDocx(tailored, candidateName, targetRole, top3Skills);

    // Audit
    const audit = auditDocumentStructure(tailored);
    audit.ats_score = atsScore;

    // Pack DOCX — Buffer is a Uint8Array subclass in Deno npm compat
    const buf = await Packer.toBuffer(doc);
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf as ArrayBufferLike);
    const docxBase64 = uint8ToBase64(u8);

    // Generate cover letter
    const coverLetterText = generateCoverLetter(tailored, jobListing as { title?: string; company?: string }, gapKeywords);

    // Build filename
    const docxFilename = `${candidateName.replace(/\s+/g, '_')}_${targetRole.replace(/\s+/g, '_')}_Resume.docx`;

    // Create ResumeVersion
    const versionData = {
      user_id,
      job_listing_id,
      version_type: format,
      resume_text: tailoredText,
      docx_base64: docxBase64,
      docx_filename: docxFilename,
      cover_letter_text: coverLetterText,
      ats_score: atsScore,
      keyword_gaps_filled: gapKeywords,
      simon_audit_passed: audit.passed,
      audit_log: audit,
      tailor_round: round,
      needs_manual_review: !audit.passed || atsScore < 60,
      created_at: new Date().toISOString(),
    };

    const createdVersion = await ResumeVersion.create(versionData);
    const resumeVersionId = createdVersion?.id ?? createdVersion;

    // Update JobListing with final status
    const finalStatus = audit.passed && atsScore >= 60 ? 'pending_review' : 'needs_attention';
    const simonSummary = `ATS: ${atsScore}/100 · ${gapKeywords.length} keywords injected · ${audit.passed ? 'Audit passed' : 'Needs review'} · Round ${round}`;

    // Build flagged_reason for AttentionBanner in ReviewQueue
    const flaggedReasonParts: string[] = [];
    if (audit.meta_issues?.length > 0) flaggedReasonParts.push(`Structure: ${audit.meta_issues.join(', ')}`);
    if (audit.ghost_strings?.length > 0) flaggedReasonParts.push('Ghost strings detected in resume');
    if (atsScore < 60) flaggedReasonParts.push(`Low ATS score (${atsScore}/100)`);
    const flaggedReason = flaggedReasonParts.join(' | ');

    await JobListing.update(job_listing_id, {
      status: finalStatus,
      simon_summary: simonSummary,
      ...(flaggedReason && { flagged_reason: flaggedReason }),
    });

    return Response.json({
      success: true,
      resume_version_id: resumeVersionId,
      ats_score: atsScore,
      round,
      keyword_gaps_filled: gapKeywords,
      audit,
      status: finalStatus,
      needs_manual_review: !audit.passed || atsScore < 60,
      // Include DOCX directly in response so ReviewQueue can offer immediate download
      docx_base64: docxBase64,
      docx_filename: docxFilename,
    });
  } catch (err) {
    console.error('[orchestrateTailoring] Error:', err);
    return Response.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 },
    );
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'npm:docx@8';

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

const SECTION_PATTERNS = [
  { type: 'summary',        regex: /^(professional\s+)?summary|profile|objective|about/i },
  { type: 'experience',     regex: /experience|employment|work\s+history|career/i },
  { type: 'skills',         regex: /skills|competencies|expertise|technologies|tools/i },
  { type: 'education',      regex: /education|academic|degree|university|college/i },
  { type: 'certifications', regex: /certif|licens|accredit|credential/i },
];

function extractKeywords(text) {
  const cleaned = text.replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = cleaned.split(/\s+/);
  const result = new Set();
  for (const word of words) {
    const lower = word.toLowerCase();
    if (lower.length > 2 && !STOPWORDS.has(lower)) result.add(lower);
  }
  return result;
}

function findKeywordGaps(jdText, resumeText) {
  const resumeKeywords = extractKeywords(resumeText);
  const jdLower = jdText.toLowerCase();
  const jdWords = jdLower.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/);
  const freq = new Map();
  for (const word of jdWords) {
    if (word.length > 2 && !STOPWORDS.has(word)) freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  const gaps = [];
  for (const [kw, count] of freq.entries()) {
    if (resumeKeywords.has(kw)) continue;
    if (count >= 2 || HR_TERMS.has(kw)) gaps.push(kw);
  }
  gaps.sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));
  return gaps.slice(0, 15);
}

function scoreATSCompliance(resumeText, jdText) {
  const resumeKeywords = extractKeywords(resumeText);
  const jdKeywords = extractKeywords(jdText);
  if (jdKeywords.size === 0) return 40;
  let overlap = 0;
  for (const kw of jdKeywords) { if (resumeKeywords.has(kw)) overlap++; }
  return Math.min(100, Math.round(40 + (overlap / jdKeywords.size) * 60));
}

function parseResumeText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return { name: '', contact: '', sections: [] };
  const name = lines[0] ?? '';
  const contactLines = [];
  for (let i = 1; i <= Math.min(4, lines.length - 1); i++) {
    const line = lines[i];
    if (/@/.test(line) || /\+?[\d\s\-().]{7,}/.test(line) || /linkedin/i.test(line)) contactLines.push(line);
  }
  const contact = contactLines.join(' | ');
  const sectionStartIdx = contactLines.length > 0 ? 1 + contactLines.length : 1;
  const sections = [];
  let currentSection = null;
  for (let i = sectionStartIdx; i < lines.length; i++) {
    const line = lines[i];
    let matchedType = null;
    if (line.length < 50) {
      for (const pat of SECTION_PATTERNS) {
        if (pat.regex.test(line)) { matchedType = pat.type; break; }
      }
    }
    if (matchedType !== null) {
      if (currentSection) sections.push(currentSection);
      currentSection = { type: matchedType, heading: line, content: [] };
    } else {
      if (currentSection) currentSection.content.push(line);
      else currentSection = { type: 'other', heading: 'ADDITIONAL', content: [line] };
    }
  }
  if (currentSection) sections.push(currentSection);
  return { name, contact, sections };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function injectKeywordsIntoResume(parsed, gapKeywords, _jdText) {
  const cloned = {
    name: parsed.name,
    contact: parsed.contact,
    sections: parsed.sections.map((s) => ({ ...s, content: [...s.content] })),
  };
  const skillsIdx = cloned.sections.findIndex((s) => s.type === 'skills');
  const summaryIdx = cloned.sections.findIndex((s) => s.type === 'summary');
  if (skillsIdx >= 0) {
    const ss = cloned.sections[skillsIdx];
    const existing = ss.content.join(' ').toLowerCase();
    const newKw = gapKeywords.filter((kw) => !existing.includes(kw));
    if (newKw.length > 0) ss.content.push(newKw.map(capitalize).join(' · '));
  } else {
    cloned.sections.splice(1, 0, {
      type: 'skills',
      heading: 'CORE COMPETENCIES',
      content: [gapKeywords.map(capitalize).join(' · ')],
    });
  }
  const adjSummaryIdx = summaryIdx >= 0 ? cloned.sections.findIndex((s) => s.type === 'summary') : -1;
  if (adjSummaryIdx >= 0) {
    const ss = cloned.sections[adjSummaryIdx];
    if (ss.content.length > 0) {
      const top3 = gapKeywords.slice(0, 3).map(capitalize);
      const last = ss.content[ss.content.length - 1].toLowerCase();
      if (top3.length > 0 && !top3.every((kw) => last.includes(kw.toLowerCase()))) {
        ss.content.push(`Proven expertise in ${top3.join(', ')}.`);
      }
    }
  }
  return cloned;
}

function auditDocumentStructure(parsed) {
  const metaIssues = [];
  const ghostStrings = [];
  const sectionParse = {};
  if (!parsed.sections.some((s) => s.type === 'experience')) metaIssues.push('no_experience_section');
  if (!parsed.sections.some((s) => s.type === 'skills')) metaIssues.push('no_skills_section');
  for (const section of parsed.sections) {
    const isEmpty = section.content.length === 0;
    if (isEmpty) metaIssues.push(`empty_section:${section.type}`);
    sectionParse[section.type] = !isEmpty;
    if (section.type === 'skills') {
      for (const line of section.content) {
        if (line.length > 200) ghostStrings.push(line.substring(0, 80) + '…');
      }
    }
  }
  return { passed: metaIssues.length === 0 && ghostStrings.length === 0, ghost_strings: ghostStrings, meta_issues: metaIssues, section_parse: sectionParse, ats_score: 0 };
}

function buildStandardDocx(parsed, candidateName, targetRole, top3Skills) {
  const children = [];
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: parsed.name || candidateName, bold: true, size: 48, color: '1A3656', font: 'Calibri' })],
  }));
  if (parsed.contact) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: parsed.contact, size: 18, color: '444444', font: 'Calibri' })],
    }));
  }
  children.push(new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { color: '0070C0', size: 6, style: BorderStyle.SINGLE } },
    children: [],
  }));
  for (const section of parsed.sections) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 },
      border: { bottom: { color: 'E0E0E0', size: 2, style: BorderStyle.SINGLE } },
      children: [new TextRun({ text: section.heading.toUpperCase(), bold: true, size: 22, color: '0070C0', font: 'Calibri' })],
    }));
    for (const line of section.content) {
      const isBullet = /^[•\-*]/.test(line.trim());
      children.push(new Paragraph({
        bullet: isBullet ? { level: 0 } : undefined, spacing: { after: 60 },
        children: [new TextRun({ text: isBullet ? line.replace(/^[•\-*]\s*/, '') : line, size: 20, font: 'Calibri' })],
      }));
    }
  }
  return new Document({
    creator: candidateName, title: `${candidateName} - Resume`, subject: targetRole,
    keywords: top3Skills.join(', '), description: '', lastModifiedBy: candidateName, revision: 1,
    sections: [{ properties: { page: { margin: { top: 720, right: 1008, bottom: 720, left: 1008 } } }, children }],
    styles: { default: { document: { run: { font: 'Calibri', size: 20 } } } },
  });
}

function generateCoverLetter(parsed, jobListing, gapKeywordsFilled) {
  const role = jobListing.title ?? 'the position';
  const company = jobListing.company ?? 'your organization';
  const summaryText = parsed.sections.find((s) => s.type === 'summary')?.content.join(' ') ?? '';
  const firstExpLine = parsed.sections.find((s) => s.type === 'experience')?.content.find((l) => l.trim().length > 0) ?? '';
  const top3 = gapKeywordsFilled.slice(0, 3).map(capitalize);
  const top5 = gapKeywordsFilled.slice(0, 5).map(capitalize);
  const para1 = [`I am writing to express my strong interest in the ${role} position at ${company}.`, summaryText].filter(Boolean).join(' ');
  const para2 = [
    top3.length > 0 ? `Throughout my career, I have developed deep expertise in ${top3.join(', ')}, which directly aligns with the requirements of this role.` : '',
    firstExpLine ? `In my recent experience, ${firstExpLine.toLowerCase()}.` : '',
  ].filter(Boolean).join(' ') || 'My professional background has equipped me with the skills and experience needed to excel in this position.';
  const para3 = top5.length > 0
    ? `I bring proven strengths in ${top5.join(', ')}, and I am excited about the opportunity to contribute to ${company}. Thank you for considering my application — I look forward to discussing how I can add value to your team.`
    : `I am eager to bring my skills and dedication to ${company} and would welcome the opportunity to discuss my qualifications further. Thank you for your time and consideration.`;
  return [para1, '', para2, '', para3, '', `Sincerely,\n${parsed.name}`].join('\n');
}

function uint8ToBase64(u8) {
  let b = '';
  for (let i = 0; i < u8.length; i++) b += String.fromCharCode(u8[i]);
  return btoa(b);
}

function resumeToText(parsed) {
  const parts = [parsed.name, parsed.contact];
  for (const section of parsed.sections) { parts.push(section.heading); parts.push(...section.content); }
  return parts.join('\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { user_id = user.id, job_listing_id, format = 'standard' } = body;
    if (!job_listing_id) return Response.json({ error: 'job_listing_id is required' }, { status: 400 });

    const JobListing = base44.asServiceRole.entities.JobListing;
    const Resume = base44.asServiceRole.entities.Resume;
    const ResumeVersion = base44.asServiceRole.entities.ResumeVersion;

    let jobListing = null;
    try {
      jobListing = await JobListing.get(job_listing_id) ?? null;
    } catch {
      const listings = await JobListing.filter({ id: job_listing_id }).catch(() => []);
      jobListing = listings?.[0] ?? null;
    }
    if (!jobListing) return Response.json({ error: 'Job listing not found' }, { status: 404 });

    const resumes = await Resume.filter({ user_id });
    const masterResume = resumes?.find((r) => r.is_master_resume) ?? resumes?.[0] ?? null;
    if (!masterResume) return Response.json({ error: 'No master resume found for user' }, { status: 400 });

    const masterText = (masterResume.content ?? masterResume.resume_text ?? masterResume.parsed_content ?? masterResume.optimized_content ?? '');
    const jdText = (jobListing.jd_text ?? '');
    const candidateName = (masterResume.candidate_name ?? user.full_name ?? user.email ?? 'Candidate');
    const targetRole = (jobListing.title ?? jobListing.job_title ?? 'Professional');

    await JobListing.update(job_listing_id, { status: 'tailoring' });

    let parsed = parseResumeText(masterText);
    let gapKeywords = findKeywordGaps(jdText, masterText);
    let tailored = injectKeywordsIntoResume(parsed, gapKeywords, jdText);
    let tailoredText = resumeToText(tailored);
    let atsScore = scoreATSCompliance(tailoredText, jdText);
    let round = 1;
    console.log(`[orchestrateTailoring] Round 1 — ATS: ${atsScore}, gaps: ${gapKeywords.length}`);

    if (atsScore < 75) {
      const round2Gaps = findKeywordGaps(jdText, tailoredText);
      if (round2Gaps.length > 0) {
        tailored = injectKeywordsIntoResume(tailored, round2Gaps, jdText);
        tailoredText = resumeToText(tailored);
        atsScore = scoreATSCompliance(tailoredText, jdText);
        gapKeywords = [...new Set([...gapKeywords, ...round2Gaps])];
        round = 2;
        console.log(`[orchestrateTailoring] Round 2 — ATS: ${atsScore}, gaps: ${gapKeywords.length}`);
      }
    }

    const skillsSection = tailored.sections.find((s) => s.type === 'skills');
    let top3Skills = skillsSection
      ? skillsSection.content.join(' ').split(/[·,]/).map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 3)
      : [];
    if (top3Skills.length === 0) top3Skills = gapKeywords.slice(0, 3).map(capitalize);

    const doc = buildStandardDocx(tailored, candidateName, targetRole, top3Skills);
    const audit = auditDocumentStructure(tailored);
    audit.ats_score = atsScore;

    const buf = await Packer.toBuffer(doc);
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    const docxBase64 = uint8ToBase64(u8);

    const coverLetterText = generateCoverLetter(tailored, jobListing, gapKeywords);
    const docxFilename = `${candidateName.replace(/\s+/g, '_')}_${targetRole.replace(/\s+/g, '_')}_Resume.docx`;

    const createdVersion = await ResumeVersion.create({
      user_id, job_listing_id, base_resume_id: masterResume.id, resume_text: tailoredText,
      docx_base64: docxBase64, docx_filename: docxFilename, cover_letter_text: coverLetterText,
      ats_score: atsScore, keyword_gaps_filled: gapKeywords, simon_audit_passed: audit.passed,
      audit_log: audit, tailor_round: round, needs_manual_review: !audit.passed || atsScore < 60,
      created_at: new Date().toISOString(),
    });

    const finalStatus = audit.passed && atsScore >= 60 ? 'pending_review' : 'needs_attention';
    await JobListing.update(job_listing_id, {
      status: finalStatus,
      simon_summary: `ATS: ${atsScore}/100 · ${gapKeywords.length} keywords injected · ${audit.passed ? 'Audit passed' : 'Needs review'} · Round ${round}`,
    });

    return Response.json({
      success: true,
      resume_version_id: createdVersion?.id ?? createdVersion,
      ats_score: atsScore,
      round,
      keyword_gaps_filled: gapKeywords,
      audit,
      status: finalStatus,
      needs_manual_review: !audit.passed || atsScore < 60,
      docx_base64: docxBase64,
      docx_filename: docxFilename,
    });
  } catch (err) {
    console.error('[orchestrateTailoring] Error:', err);
    return Response.json({ error: 'Internal server error', detail: String(err) }, { status: 500 });
  }
});
import { distance } from 'fastest-levenshtein';
import type {
  ResumeData,
  ResumeSection,
  ExperienceItem,
  EducationItem,
  SkillGroupItem,
} from '@/components/resume-templates/types';

// ── Types ─────────────────────────────────────────────────────────

export type AtsCheckStatus = 'pass' | 'warning' | 'fail';
export type AtsCheckCategory = 'parsability' | 'keywords' | 'readability' | 'format';

export type AtsCheck = {
  id: string;
  category: AtsCheckCategory;
  name: string;
  status: AtsCheckStatus;
  message: string;
  details?: string[];
};

export type AtsCategorySummary = {
  category: AtsCheckCategory;
  label: string;
  passed: number;
  warned: number;
  failed: number;
  total: number;
  checks: AtsCheck[];
};

export type AtsCheckResult = {
  score: number;
  categories: AtsCategorySummary[];
  totalPassed: number;
  totalWarned: number;
  totalFailed: number;
  totalChecks: number;
  checkedAt: string;
};

export type AtsCheckInput = {
  resumeData: ResumeData;
  html: string;
  jdAnalysis: {
    coverageScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  } | null;
};

// ── Constants ─────────────────────────────────────────────────────

export const STANDARD_SECTION_HEADINGS = [
  'experience',
  'work experience',
  'work history',
  'professional experience',
  'employment history',
  'education',
  'academic background',
  'skills',
  'technical skills',
  'core competencies',
  'projects',
  'personal projects',
  'summary',
  'professional summary',
  'objective',
  'career objective',
  'certifications',
  'awards',
  'publications',
  'volunteer',
  'volunteer experience',
  'languages',
  'interests',
  'references',
];

export const ACTION_VERBS = [
  'led',
  'developed',
  'implemented',
  'designed',
  'managed',
  'built',
  'optimized',
  'delivered',
  'created',
  'launched',
  'improved',
  'increased',
  'reduced',
  'automated',
  'architected',
  'established',
  'spearheaded',
  'streamlined',
  'mentored',
  'coordinated',
  'engineered',
  'integrated',
  'migrated',
  'refactored',
  'scaled',
  'transformed',
  'deployed',
  'configured',
  'resolved',
  'analyzed',
  'collaborated',
  'directed',
  'drove',
  'executed',
  'facilitated',
  'initiated',
  'introduced',
  'maintained',
  'modernized',
  'negotiated',
  'orchestrated',
  'oversaw',
  'pioneered',
  'planned',
  'produced',
  'revamped',
  'supervised',
  'trained',
  'upgraded',
  'wrote',
];

export const SAFE_FONTS = [
  'open sans',
  'roboto',
  'lato',
  'arial',
  'helvetica',
  'georgia',
  'times new roman',
  'inter',
  'source sans pro',
  'montserrat',
  'nunito',
  'pt sans',
  'calibri',
  'verdana',
  'tahoma',
  'trebuchet ms',
  'segoe ui',
  'noto sans',
];

export const QUANTIFIED_PATTERN =
  /\d+%|\$\d|[0-9]+[xX]|[0-9]+\s*(users|clients|team|projects|apps|increase|decrease|revenue|savings|improve)/i;

export const COMMON_DATE_PATTERNS = [
  // "Jan 2020 – Present", "Jan 2020 - Dec 2022"
  /^[A-Z][a-z]{2}\s+\d{4}\s*[–\-]\s*([A-Z][a-z]{2}\s+\d{4}|Present)$/,
  // "January 2020 – Present", "January 2020 - December 2022"
  /^[A-Z][a-z]+\s+\d{4}\s*[–\-]\s*([A-Z][a-z]+\s+\d{4}|Present)$/,
  // "2020 – 2022", "2020 - Present"
  /^\d{4}\s*[–\-]\s*(\d{4}|Present)$/,
  // "01/2020 – 12/2022"
  /^\d{1,2}\/\d{4}\s*[–\-]\s*(\d{1,2}\/\d{4}|Present)$/,
  // "2020"
  /^\d{4}$/,
];

const HEADING_FUZZY_THRESHOLD = 0.85;

// ── Parsability Checks (P1–P7) ────────────────────────────────────

export function checkContactInfo(input: AtsCheckInput): AtsCheck {
  const { profile } = input.resumeData;
  const missing: string[] = [];

  if (!profile.email) {
    return {
      id: 'P1',
      category: 'parsability',
      name: 'Contact info present',
      status: 'fail',
      message: 'Email is missing. ATS systems require an email address.',
    };
  }

  if (!profile.phone) missing.push('phone');
  if (!profile.location) missing.push('location');

  if (missing.length > 0) {
    return {
      id: 'P1',
      category: 'parsability',
      name: 'Contact info present',
      status: 'warning',
      message: `Email found. Missing: ${missing.join(', ')}.`,
    };
  }

  return {
    id: 'P1',
    category: 'parsability',
    name: 'Contact info present',
    status: 'pass',
    message: 'Email, phone, and location are all present.',
  };
}

export function checkSectionHeadings(input: AtsCheckInput): AtsCheck {
  const nonStandard: string[] = [];

  for (const section of input.resumeData.sections) {
    const label = section.label.toLowerCase().trim();
    const isStandard = STANDARD_SECTION_HEADINGS.some((heading) => {
      if (heading === label) return true;
      const maxLen = Math.max(heading.length, label.length);
      if (maxLen === 0) return true;
      const similarity = 1 - distance(heading, label) / maxLen;
      return similarity >= HEADING_FUZZY_THRESHOLD;
    });

    if (!isStandard) {
      nonStandard.push(section.label);
    }
  }

  if (nonStandard.length > 0) {
    return {
      id: 'P2',
      category: 'parsability',
      name: 'Standard section headings',
      status: 'warning',
      message: `${nonStandard.length} non-standard section heading(s) found. Some ATS parsers may not recognize them.`,
      details: nonStandard.map((h) => `"${h}" is not a standard ATS heading`),
    };
  }

  return {
    id: 'P2',
    category: 'parsability',
    name: 'Standard section headings',
    status: 'pass',
    message: 'All section headings are ATS-recognized.',
  };
}

export function checkDateFormatConsistency(input: AtsCheckInput): AtsCheck {
  const dates: { label: string; date: string }[] = [];

  for (const section of input.resumeData.sections) {
    if (section.type === 'experience') {
      for (const item of section.items as ExperienceItem[]) {
        if (item.displayDate) {
          dates.push({ label: `${item.title} at ${item.company}`, date: item.displayDate });
        }
      }
    }
    if (section.type === 'education') {
      for (const item of section.items as EducationItem[]) {
        if (item.displayDate) {
          dates.push({ label: item.institution, date: item.displayDate });
        }
      }
    }
  }

  if (dates.length === 0) {
    return {
      id: 'P3',
      category: 'parsability',
      name: 'Date format consistency',
      status: 'pass',
      message: 'No dates to check.',
    };
  }

  // Determine which pattern each date matches
  const patternIndices = dates.map((d) => {
    const idx = COMMON_DATE_PATTERNS.findIndex((p) => p.test(d.date));
    return idx;
  });

  const unrecognized = dates.filter((_, i) => patternIndices[i] === -1);
  const recognized = patternIndices.filter((i) => i !== -1);
  const uniquePatterns = Array.from(new Set(recognized));

  if (unrecognized.length > 0) {
    return {
      id: 'P3',
      category: 'parsability',
      name: 'Date format consistency',
      status: 'warning',
      message: `${unrecognized.length} date(s) use an unrecognized format.`,
      details: unrecognized.map((d) => `"${d.date}" (${d.label})`),
    };
  }

  if (uniquePatterns.length > 1) {
    return {
      id: 'P3',
      category: 'parsability',
      name: 'Date format consistency',
      status: 'warning',
      message: 'Dates use inconsistent formats across entries.',
      details: dates.map((d) => `"${d.date}" (${d.label})`),
    };
  }

  return {
    id: 'P3',
    category: 'parsability',
    name: 'Date format consistency',
    status: 'pass',
    message: 'All dates use a consistent, recognized format.',
  };
}

export function checkNoEmptySections(input: AtsCheckInput): AtsCheck {
  const empty: string[] = [];

  for (const section of input.resumeData.sections) {
    if (section.items.length === 0) {
      empty.push(section.label);
    }
  }

  if (empty.length > 0) {
    return {
      id: 'P4',
      category: 'parsability',
      name: 'No empty sections',
      status: 'fail',
      message: `${empty.length} section(s) have no items.`,
      details: empty.map((label) => `"${label}" is empty`),
    };
  }

  return {
    id: 'P4',
    category: 'parsability',
    name: 'No empty sections',
    status: 'pass',
    message: 'All sections contain at least one item.',
  };
}

export function checkSummaryPresent(input: AtsCheckInput): AtsCheck {
  const summary = input.resumeData.summary;

  if (!summary || summary.trim().length === 0) {
    return {
      id: 'P5',
      category: 'parsability',
      name: 'Summary present',
      status: 'warning',
      message: 'No summary/objective found. A summary helps ATS parsers identify your profile.',
    };
  }

  return {
    id: 'P5',
    category: 'parsability',
    name: 'Summary present',
    status: 'pass',
    message: 'Summary section is present.',
  };
}

export function checkTemplateAtsSafety(input: AtsCheckInput): AtsCheck {
  const html = input.html;
  const unsafeTags: string[] = [];

  if (/<table[\s>]/i.test(html)) unsafeTags.push('<table>');
  if (/<img[\s>]/i.test(html)) unsafeTags.push('<img>');
  if (/<canvas[\s>]/i.test(html)) unsafeTags.push('<canvas>');
  if (/<svg[\s>]/i.test(html)) unsafeTags.push('<svg>');

  if (unsafeTags.length > 0) {
    return {
      id: 'P6',
      category: 'parsability',
      name: 'Template ATS safety',
      status: 'fail',
      message: `HTML contains ATS-unfriendly elements: ${unsafeTags.join(', ')}.`,
      details: unsafeTags.map((tag) => `${tag} may cause parsing issues in ATS systems`),
    };
  }

  return {
    id: 'P6',
    category: 'parsability',
    name: 'Template ATS safety',
    status: 'pass',
    message: 'Template uses ATS-safe HTML elements (no tables, images, canvas, or SVG).',
  };
}

export function checkNoHeaderFooterContent(input: AtsCheckInput): AtsCheck {
  const html = input.html;
  const issues: string[] = [];

  // Check for position: fixed
  if (/position\s*:\s*fixed/i.test(html)) {
    issues.push('Found position: fixed — content may be lost in ATS parsing');
  }

  // Check for position: absolute outside of small monogram containers
  const absoluteMatches = html.match(/position\s*:\s*absolute/gi);
  if (absoluteMatches) {
    // Allow position: absolute only inside elements with width ≤ 70px
    // Simple heuristic: check if all absolute positioning is within contexts of small widths
    const absoluteContexts = Array.from(
      html.matchAll(/width\s*:\s*(\d+)px[^}]*position\s*:\s*absolute/gi)
    );
    const largeAbsolute = absoluteContexts.filter((m) => parseInt(m[1]) > 70);

    // Also check for absolute positioning without any width context nearby
    const standaloneAbsolute = Array.from(
      html.matchAll(/position\s*:\s*absolute(?![^}]*width\s*:\s*\d+px)/gi)
    );

    if (largeAbsolute.length > 0 || standaloneAbsolute.length > 0) {
      issues.push(
        'Found position: absolute outside small container — content may shift in ATS parsing'
      );
    }
  }

  if (issues.length > 0) {
    return {
      id: 'P7',
      category: 'parsability',
      name: 'No header/footer content',
      status: 'warning',
      message: 'Fixed or absolutely positioned elements detected.',
      details: issues,
    };
  }

  return {
    id: 'P7',
    category: 'parsability',
    name: 'No header/footer content',
    status: 'pass',
    message: 'No fixed-position elements found.',
  };
}

// ── Keyword Optimization Checks (K1–K3) ──────────────────────────

export function checkJdKeywordCoverage(input: AtsCheckInput): AtsCheck | null {
  if (!input.jdAnalysis) return null;

  const score = input.jdAnalysis.coverageScore;

  if (score >= 0.7) {
    return {
      id: 'K1',
      category: 'keywords',
      name: 'JD keyword coverage',
      status: 'pass',
      message: `Keyword coverage is ${Math.round(score * 100)}% — strong match with the job description.`,
    };
  }

  if (score >= 0.5) {
    return {
      id: 'K1',
      category: 'keywords',
      name: 'JD keyword coverage',
      status: 'warning',
      message: `Keyword coverage is ${Math.round(score * 100)}% — consider adding more relevant keywords.`,
    };
  }

  return {
    id: 'K1',
    category: 'keywords',
    name: 'JD keyword coverage',
    status: 'fail',
    message: `Keyword coverage is ${Math.round(score * 100)}% — significant keyword gaps detected.`,
  };
}

export function checkMissingKeywords(input: AtsCheckInput): AtsCheck | null {
  if (!input.jdAnalysis) return null;

  const missing = input.jdAnalysis.missingKeywords;

  if (missing.length === 0) {
    return {
      id: 'K2',
      category: 'keywords',
      name: 'Missing keywords',
      status: 'pass',
      message: 'All JD keywords are present in the resume.',
    };
  }

  return {
    id: 'K2',
    category: 'keywords',
    name: 'Missing keywords',
    status: 'warning',
    message: `${missing.length} keyword(s) from the job description are missing.`,
    details: missing,
  };
}

export function checkKeywordsInSummary(input: AtsCheckInput): AtsCheck | null {
  if (!input.jdAnalysis) return null;

  const summary = input.resumeData.summary;
  if (!summary || summary.trim().length === 0) {
    return {
      id: 'K3',
      category: 'keywords',
      name: 'Keywords in summary',
      status: 'warning',
      message: 'No summary present to check for keyword placement.',
    };
  }

  const summaryLower = summary.toLowerCase();
  const matched = input.jdAnalysis.matchedKeywords.filter((kw) =>
    summaryLower.includes(kw.toLowerCase())
  );

  if (matched.length >= 3) {
    return {
      id: 'K3',
      category: 'keywords',
      name: 'Keywords in summary',
      status: 'pass',
      message: `${matched.length} matched keyword(s) appear in the summary.`,
    };
  }

  return {
    id: 'K3',
    category: 'keywords',
    name: 'Keywords in summary',
    status: 'warning',
    message: `Only ${matched.length} matched keyword(s) in the summary. Aim for at least 3.`,
    details:
      matched.length > 0
        ? [`Found: ${matched.join(', ')}`]
        : ['No matched keywords found in summary'],
  };
}

// ── Readability/Structure Checks (R1–R7) ──────────────────────────

export function checkBulletPointLength(input: AtsCheckInput): AtsCheck {
  const offenders: string[] = [];

  for (const section of input.resumeData.sections) {
    if (section.type !== 'experience') continue;
    for (const item of section.items as ExperienceItem[]) {
      const bullets = item.description.split('\n').filter((b) => b.trim().length > 0);
      for (const bullet of bullets) {
        const trimmed = bullet.trim();
        if (trimmed.length > 200) {
          offenders.push(
            `Too long (${trimmed.length} chars): "${trimmed.slice(0, 50)}..." — ${item.title}`
          );
        } else if (trimmed.length < 30) {
          offenders.push(`Too short (${trimmed.length} chars): "${trimmed}" — ${item.title}`);
        }
      }
    }
  }

  if (offenders.length > 0) {
    return {
      id: 'R1',
      category: 'readability',
      name: 'Bullet point length',
      status: 'warning',
      message: `${offenders.length} bullet(s) are outside the ideal 30–200 character range.`,
      details: offenders,
    };
  }

  return {
    id: 'R1',
    category: 'readability',
    name: 'Bullet point length',
    status: 'pass',
    message: 'All bullet points are within the ideal 30–200 character range.',
  };
}

export function checkQuantifiedAchievements(input: AtsCheckInput): AtsCheck {
  let totalBullets = 0;
  let quantified = 0;

  for (const section of input.resumeData.sections) {
    if (section.type !== 'experience') continue;
    for (const item of section.items as ExperienceItem[]) {
      const bullets = item.description.split('\n').filter((b) => b.trim().length > 0);
      totalBullets += bullets.length;
      for (const bullet of bullets) {
        if (QUANTIFIED_PATTERN.test(bullet)) {
          quantified++;
        }
      }
    }
  }

  if (totalBullets === 0) {
    return {
      id: 'R2',
      category: 'readability',
      name: 'Quantified achievements',
      status: 'warning',
      message: 'No experience bullets to analyze.',
    };
  }

  const ratio = quantified / totalBullets;

  if (ratio >= 0.2) {
    return {
      id: 'R2',
      category: 'readability',
      name: 'Quantified achievements',
      status: 'pass',
      message: `${Math.round(ratio * 100)}% of bullets contain quantified metrics (${quantified}/${totalBullets}).`,
    };
  }

  return {
    id: 'R2',
    category: 'readability',
    name: 'Quantified achievements',
    status: 'warning',
    message: `Only ${Math.round(ratio * 100)}% of bullets contain metrics (${quantified}/${totalBullets}). Aim for at least 20%.`,
  };
}

export function checkSectionCount(input: AtsCheckInput): AtsCheck {
  const count = input.resumeData.sections.length;

  if (count >= 3) {
    return {
      id: 'R3',
      category: 'readability',
      name: 'Section count',
      status: 'pass',
      message: `Resume has ${count} sections.`,
    };
  }

  return {
    id: 'R3',
    category: 'readability',
    name: 'Section count',
    status: 'warning',
    message: `Resume has only ${count} section(s). Consider adding more for a complete profile.`,
  };
}

export function checkExperiencePosition(input: AtsCheckInput): AtsCheck {
  const sections = input.resumeData.sections;
  const expIndex = sections.findIndex((s) => s.type === 'experience');

  if (expIndex === -1) {
    return {
      id: 'R4',
      category: 'readability',
      name: 'Experience section position',
      status: 'warning',
      message: 'No experience section found in the resume.',
    };
  }

  if (expIndex <= 1) {
    return {
      id: 'R4',
      category: 'readability',
      name: 'Experience section position',
      status: 'pass',
      message: `Experience section is at position ${expIndex + 1} — prominently placed.`,
    };
  }

  return {
    id: 'R4',
    category: 'readability',
    name: 'Experience section position',
    status: 'warning',
    message: `Experience section is at position ${expIndex + 1}. Consider moving it to the top 2 sections.`,
  };
}

export function checkSkillsDensity(input: AtsCheckInput): AtsCheck {
  let totalSkills = 0;

  for (const section of input.resumeData.sections) {
    if (section.type !== 'skills') continue;
    for (const group of section.items as SkillGroupItem[]) {
      totalSkills += group.skills.length;
    }
  }

  if (totalSkills < 8) {
    return {
      id: 'R5',
      category: 'readability',
      name: 'Skills density',
      status: 'warning',
      message: `Only ${totalSkills} skill(s) listed. Consider adding more to improve keyword matching.`,
    };
  }

  if (totalSkills > 40) {
    return {
      id: 'R5',
      category: 'readability',
      name: 'Skills density',
      status: 'warning',
      message: `${totalSkills} skills listed — this may appear as keyword stuffing. Consider focusing on the most relevant.`,
    };
  }

  return {
    id: 'R5',
    category: 'readability',
    name: 'Skills density',
    status: 'pass',
    message: `${totalSkills} skills listed — good density for ATS matching.`,
  };
}

export function checkSummaryLength(input: AtsCheckInput): AtsCheck {
  const summary = input.resumeData.summary;

  if (!summary || summary.trim().length === 0) {
    return {
      id: 'R6',
      category: 'readability',
      name: 'Summary length',
      status: 'warning',
      message: 'No summary present.',
    };
  }

  const length = summary.trim().length;

  if (length < 100) {
    return {
      id: 'R6',
      category: 'readability',
      name: 'Summary length',
      status: 'warning',
      message: `Summary is ${length} characters — too short. Aim for 100–400 characters.`,
    };
  }

  if (length > 400) {
    return {
      id: 'R6',
      category: 'readability',
      name: 'Summary length',
      status: 'warning',
      message: `Summary is ${length} characters — too long. Aim for 100–400 characters.`,
    };
  }

  return {
    id: 'R6',
    category: 'readability',
    name: 'Summary length',
    status: 'pass',
    message: `Summary is ${length} characters — within the ideal range.`,
  };
}

export function checkActionVerbs(input: AtsCheckInput): AtsCheck {
  let totalBullets = 0;
  let actionVerbBullets = 0;
  const nonActionBullets: string[] = [];

  for (const section of input.resumeData.sections) {
    if (section.type !== 'experience') continue;
    for (const item of section.items as ExperienceItem[]) {
      const bullets = item.description.split('\n').filter((b) => b.trim().length > 0);
      totalBullets += bullets.length;
      for (const bullet of bullets) {
        const trimmed = bullet.trim();
        // Strip leading bullet markers (-, *, •, etc.)
        const stripped = trimmed.replace(/^[\-\*•·▪►→]\s*/, '');
        const firstWord = stripped.split(/\s+/)[0]?.toLowerCase() ?? '';

        if (ACTION_VERBS.includes(firstWord)) {
          actionVerbBullets++;
        } else {
          nonActionBullets.push(
            `"${stripped.slice(0, 60)}${stripped.length > 60 ? '...' : ''}" — ${item.title}`
          );
        }
      }
    }
  }

  if (totalBullets === 0) {
    return {
      id: 'R7',
      category: 'readability',
      name: 'Action verbs in bullets',
      status: 'warning',
      message: 'No experience bullets to analyze.',
    };
  }

  const ratio = actionVerbBullets / totalBullets;

  if (ratio >= 0.6) {
    return {
      id: 'R7',
      category: 'readability',
      name: 'Action verbs in bullets',
      status: 'pass',
      message: `${Math.round(ratio * 100)}% of bullets start with strong action verbs (${actionVerbBullets}/${totalBullets}).`,
    };
  }

  return {
    id: 'R7',
    category: 'readability',
    name: 'Action verbs in bullets',
    status: 'warning',
    message: `Only ${Math.round(ratio * 100)}% of bullets start with action verbs (${actionVerbBullets}/${totalBullets}). Aim for at least 60%.`,
    details: nonActionBullets.slice(0, 5),
  };
}

// ── Format Compliance Checks (F1–F4) ─────────────────────────────

export function checkFontSafety(input: AtsCheckInput): AtsCheck {
  const fontFamily = input.resumeData.style.fontFamily;
  const primaryFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '').toLowerCase();

  if (SAFE_FONTS.includes(primaryFont)) {
    return {
      id: 'F1',
      category: 'format',
      name: 'Font is web-safe/embeddable',
      status: 'pass',
      message: `"${fontFamily.split(',')[0].trim()}" is a safe, widely supported font.`,
    };
  }

  return {
    id: 'F1',
    category: 'format',
    name: 'Font is web-safe/embeddable',
    status: 'warning',
    message: `"${fontFamily.split(',')[0].trim()}" may not be recognized by all ATS parsers. Consider using a standard font.`,
  };
}

export function checkFontSize(input: AtsCheckInput): AtsCheck {
  const fontSize = input.resumeData.style.fontSize;
  const match = fontSize.match(/^(\d+(?:\.\d+)?)\s*pt$/i);

  if (!match) {
    return {
      id: 'F2',
      category: 'format',
      name: 'Font size readable',
      status: 'warning',
      message: `Font size "${fontSize}" uses a non-standard unit. Expected pt (points).`,
    };
  }

  const size = parseFloat(match[1]);

  if (size < 9) {
    return {
      id: 'F2',
      category: 'format',
      name: 'Font size readable',
      status: 'warning',
      message: `Font size ${size}pt is too small. Aim for 9–12pt for readability.`,
    };
  }

  if (size > 12) {
    return {
      id: 'F2',
      category: 'format',
      name: 'Font size readable',
      status: 'warning',
      message: `Font size ${size}pt is larger than typical. Aim for 9–12pt.`,
    };
  }

  return {
    id: 'F2',
    category: 'format',
    name: 'Font size readable',
    status: 'pass',
    message: `Font size ${size}pt is within the ideal 9–12pt range.`,
  };
}

export function checkPageLength(input: AtsCheckInput): AtsCheck {
  // Heuristic: estimate content length from resume data
  let totalChars = 0;

  // Summary
  if (input.resumeData.summary) {
    totalChars += input.resumeData.summary.length;
  }

  // Profile
  totalChars += input.resumeData.profile.fullName.length;
  totalChars += input.resumeData.profile.jobTitle.length;

  // Sections
  for (const section of input.resumeData.sections) {
    totalChars += section.label.length;

    if (section.type === 'experience') {
      for (const item of section.items as ExperienceItem[]) {
        totalChars += item.title.length + item.company.length + item.displayDate.length;
        totalChars += item.description.length;
      }
    } else if (section.type === 'education') {
      for (const item of section.items as EducationItem[]) {
        totalChars += item.institution.length + item.degree.length;
        totalChars += (item.fieldOfStudy?.length ?? 0) + (item.description?.length ?? 0);
      }
    } else if (section.type === 'projects') {
      for (const item of section.items as import('@/components/resume-templates/types').ProjectItem[]) {
        totalChars += item.title.length + item.description.length;
        totalChars += item.tags.join(', ').length;
      }
    } else if (section.type === 'skills') {
      for (const group of section.items as SkillGroupItem[]) {
        totalChars += group.category.length;
        totalChars += group.skills.join(', ').length;
      }
    }
  }

  // Rough heuristic: a standard single-page resume fits ~3000-4000 characters
  // with typical formatting (margins, font size, line height)
  const estimatedPages = totalChars / 3500;

  if (estimatedPages > 1.5) {
    return {
      id: 'F3',
      category: 'format',
      name: 'Page length estimate',
      status: 'warning',
      message: `Estimated content length (~${totalChars} chars) likely exceeds a single page. Consider trimming.`,
    };
  }

  return {
    id: 'F3',
    category: 'format',
    name: 'Page length estimate',
    status: 'pass',
    message: `Content length (~${totalChars} chars) should fit within a standard resume length.`,
  };
}

export function checkSpecialCharacters(input: AtsCheckInput): AtsCheck {
  // Collect all text content
  const textParts: string[] = [];

  if (input.resumeData.summary) textParts.push(input.resumeData.summary);
  textParts.push(input.resumeData.profile.fullName);
  textParts.push(input.resumeData.profile.jobTitle);

  for (const section of input.resumeData.sections) {
    textParts.push(section.label);
    if (section.type === 'experience') {
      for (const item of section.items as ExperienceItem[]) {
        textParts.push(item.title, item.company, item.description);
      }
    } else if (section.type === 'education') {
      for (const item of section.items as EducationItem[]) {
        textParts.push(item.institution, item.degree);
        if (item.fieldOfStudy) textParts.push(item.fieldOfStudy);
        if (item.description) textParts.push(item.description);
      }
    }
  }

  const fullText = textParts.join(' ');

  // Check for problematic Unicode characters
  const issues: string[] = [];
  const fancyQuotes = fullText.match(/[\u201C\u201D\u2018\u2019]/g);
  const dashes = fullText.match(/[\u2013\u2014]/g);
  const decorative = fullText.match(
    /[\u2022\u2023\u2043\u25AA\u25AB\u25B6\u25B8\u25BA\u25BC\u25C6\u2605\u2606\u2713\u2714\u2716\u2717\u2756\u2764\u2794\u27A1]/g
  );

  if (fancyQuotes && fancyQuotes.length > 0) {
    issues.push(
      `${fancyQuotes.length} fancy quote(s) found (\u201C \u201D \u2018 \u2019) — may render as boxes in some ATS`
    );
  }
  if (dashes && dashes.length > 0) {
    issues.push(
      `${dashes.length} em/en dash(es) found (\u2013 \u2014) — some ATS may not parse these correctly`
    );
  }
  if (decorative && decorative.length > 0) {
    issues.push(`${decorative.length} decorative symbol(s) found — may not render in ATS systems`);
  }

  if (issues.length > 0) {
    return {
      id: 'F4',
      category: 'format',
      name: 'Special characters',
      status: 'warning',
      message:
        'Non-standard Unicode characters detected that may cause issues in some ATS parsers.',
      details: issues,
    };
  }

  return {
    id: 'F4',
    category: 'format',
    name: 'Special characters',
    status: 'pass',
    message: 'No problematic special characters found.',
  };
}

// ── Orchestrator ──────────────────────────────────────────────────

const CATEGORY_LABELS: Record<AtsCheckCategory, string> = {
  parsability: 'Parsability',
  keywords: 'Keyword Optimization',
  readability: 'Readability & Structure',
  format: 'Format Compliance',
};

const CATEGORY_ORDER: AtsCheckCategory[] = ['parsability', 'keywords', 'readability', 'format'];

export function runChecks(input: AtsCheckInput): AtsCheckResult {
  // Run all checks — keyword checks return null when jdAnalysis is absent
  const allChecks: (AtsCheck | null)[] = [
    // Parsability
    checkContactInfo(input),
    checkSectionHeadings(input),
    checkDateFormatConsistency(input),
    checkNoEmptySections(input),
    checkSummaryPresent(input),
    checkTemplateAtsSafety(input),
    checkNoHeaderFooterContent(input),
    // Keywords (may return null)
    checkJdKeywordCoverage(input),
    checkMissingKeywords(input),
    checkKeywordsInSummary(input),
    // Readability
    checkBulletPointLength(input),
    checkQuantifiedAchievements(input),
    checkSectionCount(input),
    checkExperiencePosition(input),
    checkSkillsDensity(input),
    checkSummaryLength(input),
    checkActionVerbs(input),
    // Format
    checkFontSafety(input),
    checkFontSize(input),
    checkPageLength(input),
    checkSpecialCharacters(input),
  ];

  // Filter out null (skipped keyword checks)
  const checks = allChecks.filter((c): c is AtsCheck => c !== null);

  // Group by category
  const grouped = new Map<AtsCheckCategory, AtsCheck[]>();
  for (const check of checks) {
    const existing = grouped.get(check.category) ?? [];
    existing.push(check);
    grouped.set(check.category, existing);
  }

  // Build category summaries in defined order
  const categories: AtsCategorySummary[] = CATEGORY_ORDER.map((cat) => {
    const catChecks = grouped.get(cat) ?? [];
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      passed: catChecks.filter((c) => c.status === 'pass').length,
      warned: catChecks.filter((c) => c.status === 'warning').length,
      failed: catChecks.filter((c) => c.status === 'fail').length,
      total: catChecks.length,
      checks: catChecks,
    };
  }).filter((cat) => cat.total > 0);

  // Compute aggregate score
  const totalPassed = checks.filter((c) => c.status === 'pass').length;
  const totalWarned = checks.filter((c) => c.status === 'warning').length;
  const totalFailed = checks.filter((c) => c.status === 'fail').length;
  const totalChecks = checks.length;

  // pass = 1.0, warning = 0.5, fail = 0.0
  const rawScore = totalChecks > 0 ? (totalPassed + totalWarned * 0.5) / totalChecks : 0;
  const score = Math.round(rawScore * 100);

  return {
    score,
    categories,
    totalPassed,
    totalWarned,
    totalFailed,
    totalChecks,
    checkedAt: new Date().toISOString(),
  };
}

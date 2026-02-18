import { describe, it, expect } from 'vitest';
import {
  checkContactInfo,
  checkSectionHeadings,
  checkDateFormatConsistency,
  checkNoEmptySections,
  checkSummaryPresent,
  checkTemplateAtsSafety,
  checkNoHeaderFooterContent,
  checkJdKeywordCoverage,
  checkMissingKeywords,
  checkKeywordsInSummary,
  checkBulletPointLength,
  checkQuantifiedAchievements,
  checkSectionCount,
  checkExperiencePosition,
  checkSkillsDensity,
  checkSummaryLength,
  checkActionVerbs,
  checkFontSafety,
  checkFontSize,
  checkPageLength,
  checkSpecialCharacters,
  runChecks,
  ATS_CHECKS_WITHOUT_JD,
  ATS_TOTAL_CHECKS,
} from '@/lib/resume-builder/ats-checker';
import type { AtsCheckInput } from '@/lib/resume-builder/ats-checker';
import type { ResumeData } from '@/components/resume-templates/types';

// ── Test Fixtures ─────────────────────────────────────────────────

const baseStyle: ResumeData['style'] = {
  primaryColor: '#1a1a1a',
  accentColor: '#2bbcb3',
  fontFamily: 'Open Sans, sans-serif',
  headingFontFamily: 'Open Sans, sans-serif',
  fontSize: '10pt',
  lineHeight: '1.4',
  margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
};

function makeResumeData(overrides?: Partial<ResumeData>): ResumeData {
  return {
    profile: {
      fullName: 'John Doe',
      jobTitle: 'Software Engineer',
      email: 'john@example.com',
      phone: '+1234567890',
      location: 'New York, NY',
      websiteUrl: null,
      linkedinUrl: null,
      githubUrl: null,
    },
    summary:
      'Experienced software engineer with 10+ years building scalable web applications using React, TypeScript, and Node.js. Passionate about clean code and mentoring teams.',
    sections: [
      {
        type: 'experience',
        label: 'Experience',
        items: [
          {
            title: 'Senior Engineer',
            company: 'TechCorp',
            displayDate: 'Jan 2020 – Present',
            description:
              'Led development of microservices architecture serving 1M+ users\nImplemented CI/CD pipeline reducing deployment time by 60%\nMentored a team of 5 junior developers on best practices',
          },
          {
            title: 'Software Developer',
            company: 'StartupCo',
            displayDate: 'Mar 2017 – Dec 2019',
            description:
              'Developed RESTful APIs handling 50K requests per day\nBuilt responsive React components with 95% test coverage\nOptimized database queries improving response time by 40%',
          },
        ],
      },
      {
        type: 'skills',
        label: 'Technical Skills',
        items: [
          {
            category: 'Frontend',
            skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'HTML', 'CSS'],
          },
          { category: 'Backend', skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'GraphQL'] },
          { category: 'DevOps', skills: ['Docker', 'AWS', 'GitHub Actions', 'Terraform'] },
        ],
      },
      {
        type: 'education',
        label: 'Education',
        items: [
          {
            institution: 'University of Technology',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            displayDate: 'Aug 2013 – May 2017',
            description: null,
          },
        ],
      },
    ],
    style: { ...baseStyle },
    pageSize: 'A4',
    ...overrides,
  };
}

const baseHtml = `<!DOCTYPE html><html><head></head><body><div style="display: flex;">Content</div></body></html>`;

function makeInput(overrides?: {
  resumeData?: Partial<ResumeData>;
  html?: string;
  jdAnalysis?: AtsCheckInput['jdAnalysis'];
}): AtsCheckInput {
  return {
    resumeData: makeResumeData(overrides?.resumeData),
    html: overrides?.html ?? baseHtml,
    jdAnalysis: overrides?.jdAnalysis ?? null,
  };
}

// ── P1: Contact Info ──────────────────────────────────────────────

describe('P1: checkContactInfo', () => {
  it('passes when all contact info is present', () => {
    const result = checkContactInfo(makeInput());
    expect(result.id).toBe('P1');
    expect(result.status).toBe('pass');
  });

  it('warns when phone is missing', () => {
    const result = checkContactInfo(
      makeInput({ resumeData: { profile: { ...makeResumeData().profile, phone: null } } })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('phone');
  });

  it('warns when location is missing', () => {
    const result = checkContactInfo(
      makeInput({ resumeData: { profile: { ...makeResumeData().profile, location: null } } })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('location');
  });

  it('warns when both phone and location are missing', () => {
    const result = checkContactInfo(
      makeInput({
        resumeData: { profile: { ...makeResumeData().profile, phone: null, location: null } },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('phone');
    expect(result.message).toContain('location');
  });

  it('fails when email is missing', () => {
    const result = checkContactInfo(
      makeInput({
        resumeData: { profile: { ...makeResumeData().profile, email: '' } },
      })
    );
    expect(result.status).toBe('fail');
    expect(result.message).toContain('Email');
  });
});

// ── P2: Section Headings ──────────────────────────────────────────

describe('P2: checkSectionHeadings', () => {
  it('passes for standard headings', () => {
    const result = checkSectionHeadings(makeInput());
    expect(result.id).toBe('P2');
    expect(result.status).toBe('pass');
  });

  it('warns for non-standard headings', () => {
    const result = checkSectionHeadings(
      makeInput({
        resumeData: {
          sections: [
            { type: 'experience', label: 'My Cool Jobs', items: [] },
            { type: 'skills', label: 'Skills', items: [] },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.details).toContain('"My Cool Jobs" is not a standard ATS heading');
  });

  it('passes for fuzzy-matched headings', () => {
    const result = checkSectionHeadings(
      makeInput({
        resumeData: {
          sections: [
            { type: 'experience', label: 'Work Experienc', items: [] }, // close to "Work Experience"
          ],
        },
      })
    );
    expect(result.status).toBe('pass');
  });
});

// ── P3: Date Format Consistency ───────────────────────────────────

describe('P3: checkDateFormatConsistency', () => {
  it('passes for consistent date formats', () => {
    const result = checkDateFormatConsistency(makeInput());
    expect(result.id).toBe('P3');
    expect(result.status).toBe('pass');
  });

  it('warns for inconsistent date formats', () => {
    const result = checkDateFormatConsistency(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [
                { title: 'Dev', company: 'A', displayDate: 'Jan 2020 – Present', description: 'x' },
                { title: 'Dev', company: 'B', displayDate: '2018 – 2019', description: 'x' },
              ],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('inconsistent');
  });

  it('warns for unrecognized date format', () => {
    const result = checkDateFormatConsistency(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [
                { title: 'Dev', company: 'A', displayDate: 'From 2020 to now', description: 'x' },
              ],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('unrecognized');
  });

  it('passes when no dates are present', () => {
    const result = checkDateFormatConsistency(
      makeInput({
        resumeData: {
          sections: [{ type: 'skills', label: 'Skills', items: [] }],
        },
      })
    );
    expect(result.status).toBe('pass');
  });
});

// ── P4: No Empty Sections ─────────────────────────────────────────

describe('P4: checkNoEmptySections', () => {
  it('passes when all sections have items', () => {
    const result = checkNoEmptySections(makeInput());
    expect(result.id).toBe('P4');
    expect(result.status).toBe('pass');
  });

  it('fails when a section is empty', () => {
    const result = checkNoEmptySections(
      makeInput({
        resumeData: {
          sections: [
            { type: 'experience', label: 'Experience', items: [] },
            {
              type: 'skills',
              label: 'Skills',
              items: [{ category: 'Lang', skills: ['JS'] }],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('fail');
    expect(result.details).toContain('"Experience" is empty');
  });
});

// ── P5: Summary Present ──────────────────────────────────────────

describe('P5: checkSummaryPresent', () => {
  it('passes when summary is present', () => {
    const result = checkSummaryPresent(makeInput());
    expect(result.id).toBe('P5');
    expect(result.status).toBe('pass');
  });

  it('warns when summary is null', () => {
    const result = checkSummaryPresent(makeInput({ resumeData: { summary: null } }));
    expect(result.status).toBe('warning');
  });

  it('warns when summary is empty string', () => {
    const result = checkSummaryPresent(makeInput({ resumeData: { summary: '   ' } }));
    expect(result.status).toBe('warning');
  });
});

// ── P6: Template ATS Safety ──────────────────────────────────────

describe('P6: checkTemplateAtsSafety', () => {
  it('passes for safe HTML', () => {
    const result = checkTemplateAtsSafety(makeInput());
    expect(result.id).toBe('P6');
    expect(result.status).toBe('pass');
  });

  it('fails when HTML contains <table>', () => {
    const result = checkTemplateAtsSafety(
      makeInput({ html: '<html><body><table><tr><td>Content</td></tr></table></body></html>' })
    );
    expect(result.status).toBe('fail');
    expect(result.message).toContain('<table>');
  });

  it('fails when HTML contains <img>', () => {
    const result = checkTemplateAtsSafety(
      makeInput({ html: '<html><body><img src="photo.jpg" /></body></html>' })
    );
    expect(result.status).toBe('fail');
    expect(result.message).toContain('<img>');
  });

  it('fails when HTML contains <svg>', () => {
    const result = checkTemplateAtsSafety(
      makeInput({ html: '<html><body><svg><circle /></svg></body></html>' })
    );
    expect(result.status).toBe('fail');
    expect(result.message).toContain('<svg>');
  });

  it('detects multiple unsafe elements', () => {
    const result = checkTemplateAtsSafety(
      makeInput({ html: '<html><body><table></table><canvas></canvas></body></html>' })
    );
    expect(result.status).toBe('fail');
    expect(result.message).toContain('<table>');
    expect(result.message).toContain('<canvas>');
  });
});

// ── P7: No Header/Footer Content ─────────────────────────────────

describe('P7: checkNoHeaderFooterContent', () => {
  it('passes for clean HTML', () => {
    const result = checkNoHeaderFooterContent(makeInput());
    expect(result.id).toBe('P7');
    expect(result.status).toBe('pass');
  });

  it('warns when HTML contains position: fixed', () => {
    const result = checkNoHeaderFooterContent(
      makeInput({ html: '<div style="position: fixed; top: 0;">Header</div>' })
    );
    expect(result.status).toBe('warning');
    expect(result.details?.[0]).toContain('position: fixed');
  });
});

// ── K1: JD Keyword Coverage ──────────────────────────────────────

describe('K1: checkJdKeywordCoverage', () => {
  it('returns null when no JD analysis', () => {
    const result = checkJdKeywordCoverage(makeInput());
    expect(result).toBeNull();
  });

  it('passes for coverage >= 0.70', () => {
    const result = checkJdKeywordCoverage(
      makeInput({
        jdAnalysis: {
          coverageScore: 0.75,
          matchedKeywords: ['React', 'TS', 'Node'],
          missingKeywords: ['Go'],
        },
      })
    );
    expect(result?.status).toBe('pass');
    expect(result?.message).toContain('75%');
  });

  it('warns for coverage between 0.50 and 0.70', () => {
    const result = checkJdKeywordCoverage(
      makeInput({
        jdAnalysis: {
          coverageScore: 0.55,
          matchedKeywords: ['React'],
          missingKeywords: ['Go', 'Rust'],
        },
      })
    );
    expect(result?.status).toBe('warning');
  });

  it('fails for coverage < 0.50', () => {
    const result = checkJdKeywordCoverage(
      makeInput({
        jdAnalysis: {
          coverageScore: 0.3,
          matchedKeywords: ['React'],
          missingKeywords: ['Go', 'Rust', 'Elixir'],
        },
      })
    );
    expect(result?.status).toBe('fail');
  });
});

// ── K2: Missing Keywords ─────────────────────────────────────────

describe('K2: checkMissingKeywords', () => {
  it('returns null when no JD analysis', () => {
    const result = checkMissingKeywords(makeInput());
    expect(result).toBeNull();
  });

  it('passes when no keywords are missing', () => {
    const result = checkMissingKeywords(
      makeInput({
        jdAnalysis: { coverageScore: 1, matchedKeywords: ['React'], missingKeywords: [] },
      })
    );
    expect(result?.status).toBe('pass');
  });

  it('warns and lists missing keywords', () => {
    const result = checkMissingKeywords(
      makeInput({
        jdAnalysis: {
          coverageScore: 0.5,
          matchedKeywords: ['React'],
          missingKeywords: ['Go', 'Rust'],
        },
      })
    );
    expect(result?.status).toBe('warning');
    expect(result?.details).toEqual(['Go', 'Rust']);
  });
});

// ── K3: Keywords in Summary ──────────────────────────────────────

describe('K3: checkKeywordsInSummary', () => {
  it('returns null when no JD analysis', () => {
    const result = checkKeywordsInSummary(makeInput());
    expect(result).toBeNull();
  });

  it('passes when >= 3 matched keywords appear in summary', () => {
    const result = checkKeywordsInSummary(
      makeInput({
        resumeData: {
          summary: 'Expert in React, TypeScript, and Node.js development.',
        },
        jdAnalysis: {
          coverageScore: 0.8,
          matchedKeywords: ['React', 'TypeScript', 'Node.js', 'Python'],
          missingKeywords: [],
        },
      })
    );
    expect(result?.status).toBe('pass');
  });

  it('warns when < 3 matched keywords in summary', () => {
    const result = checkKeywordsInSummary(
      makeInput({
        resumeData: { summary: 'I am a software developer.' },
        jdAnalysis: {
          coverageScore: 0.8,
          matchedKeywords: ['React', 'TypeScript', 'Node.js'],
          missingKeywords: [],
        },
      })
    );
    expect(result?.status).toBe('warning');
  });

  it('warns when summary is empty', () => {
    const result = checkKeywordsInSummary(
      makeInput({
        resumeData: { summary: null },
        jdAnalysis: {
          coverageScore: 0.8,
          matchedKeywords: ['React'],
          missingKeywords: [],
        },
      })
    );
    expect(result?.status).toBe('warning');
    expect(result?.message).toContain('No summary');
  });
});

// ── R1: Bullet Point Length ──────────────────────────────────────

describe('R1: checkBulletPointLength', () => {
  it('passes for ideal-length bullets', () => {
    const result = checkBulletPointLength(makeInput());
    expect(result.id).toBe('R1');
    expect(result.status).toBe('pass');
  });

  it('warns for too-long bullets', () => {
    const longBullet = 'A'.repeat(250);
    const result = checkBulletPointLength(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [
                {
                  title: 'Dev',
                  company: 'Corp',
                  displayDate: 'Jan 2020 – Present',
                  description: longBullet,
                },
              ],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.details?.[0]).toContain('Too long');
  });

  it('warns for too-short bullets', () => {
    const result = checkBulletPointLength(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [
                {
                  title: 'Dev',
                  company: 'Corp',
                  displayDate: 'Jan 2020 – Present',
                  description: 'Fixed bugs',
                },
              ],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.details?.[0]).toContain('Too short');
  });
});

// ── R2: Quantified Achievements ──────────────────────────────────

describe('R2: checkQuantifiedAchievements', () => {
  it('passes when >= 20% bullets have metrics', () => {
    const result = checkQuantifiedAchievements(makeInput());
    expect(result.id).toBe('R2');
    expect(result.status).toBe('pass');
  });

  it('warns when < 20% bullets have metrics', () => {
    const result = checkQuantifiedAchievements(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [
                {
                  title: 'Dev',
                  company: 'Corp',
                  displayDate: 'Jan 2020 – Present',
                  description:
                    'Worked on frontend applications using React\nCollaborated with team members\nParticipated in code reviews\nAttended daily standups\nHelped with documentation',
                },
              ],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('0%');
  });

  it('warns when no experience bullets exist', () => {
    const result = checkQuantifiedAchievements(
      makeInput({
        resumeData: {
          sections: [{ type: 'skills', label: 'Skills', items: [] }],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('No experience bullets');
  });
});

// ── R3: Section Count ────────────────────────────────────────────

describe('R3: checkSectionCount', () => {
  it('passes when >= 3 sections', () => {
    const result = checkSectionCount(makeInput());
    expect(result.id).toBe('R3');
    expect(result.status).toBe('pass');
  });

  it('warns when < 3 sections', () => {
    const result = checkSectionCount(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [{ title: 'Dev', company: 'A', displayDate: '2020', description: 'x' }],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
  });
});

// ── R4: Experience Position ──────────────────────────────────────

describe('R4: checkExperiencePosition', () => {
  it('passes when experience is first section', () => {
    const result = checkExperiencePosition(makeInput());
    expect(result.id).toBe('R4');
    expect(result.status).toBe('pass');
  });

  it('passes when experience is second section', () => {
    const result = checkExperiencePosition(
      makeInput({
        resumeData: {
          sections: [
            { type: 'skills', label: 'Skills', items: [] },
            { type: 'experience', label: 'Experience', items: [] },
            { type: 'education', label: 'Education', items: [] },
          ],
        },
      })
    );
    expect(result.status).toBe('pass');
  });

  it('warns when experience is third or later', () => {
    const result = checkExperiencePosition(
      makeInput({
        resumeData: {
          sections: [
            { type: 'skills', label: 'Skills', items: [] },
            { type: 'education', label: 'Education', items: [] },
            { type: 'experience', label: 'Experience', items: [] },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('position 3');
  });

  it('warns when no experience section exists', () => {
    const result = checkExperiencePosition(
      makeInput({
        resumeData: {
          sections: [{ type: 'skills', label: 'Skills', items: [] }],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('No experience section');
  });
});

// ── R5: Skills Density ───────────────────────────────────────────

describe('R5: checkSkillsDensity', () => {
  it('passes for good skill count (8-40)', () => {
    const result = checkSkillsDensity(makeInput());
    expect(result.id).toBe('R5');
    expect(result.status).toBe('pass');
  });

  it('warns when too few skills', () => {
    const result = checkSkillsDensity(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'skills',
              label: 'Skills',
              items: [{ category: 'Lang', skills: ['JS', 'TS'] }],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('2 skill(s)');
  });

  it('warns when too many skills', () => {
    const manySkills = Array.from({ length: 45 }, (_, i) => `Skill${i}`);
    const result = checkSkillsDensity(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'skills',
              label: 'Skills',
              items: [{ category: 'All', skills: manySkills }],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('keyword stuffing');
  });
});

// ── R6: Summary Length ───────────────────────────────────────────

describe('R6: checkSummaryLength', () => {
  it('passes for ideal summary length (100-400 chars)', () => {
    const result = checkSummaryLength(makeInput());
    expect(result.id).toBe('R6');
    expect(result.status).toBe('pass');
  });

  it('warns for too-short summary', () => {
    const result = checkSummaryLength(makeInput({ resumeData: { summary: 'I code stuff.' } }));
    expect(result.status).toBe('warning');
    expect(result.message).toContain('too short');
  });

  it('warns for too-long summary', () => {
    const result = checkSummaryLength(makeInput({ resumeData: { summary: 'A'.repeat(450) } }));
    expect(result.status).toBe('warning');
    expect(result.message).toContain('too long');
  });

  it('warns for missing summary', () => {
    const result = checkSummaryLength(makeInput({ resumeData: { summary: null } }));
    expect(result.status).toBe('warning');
    expect(result.message).toContain('No summary');
  });
});

// ── R7: Action Verbs ─────────────────────────────────────────────

describe('R7: checkActionVerbs', () => {
  it('passes when >= 60% bullets start with action verbs', () => {
    const result = checkActionVerbs(makeInput());
    expect(result.id).toBe('R7');
    expect(result.status).toBe('pass');
  });

  it('warns when < 60% bullets start with action verbs', () => {
    const result = checkActionVerbs(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [
                {
                  title: 'Dev',
                  company: 'Corp',
                  displayDate: 'Jan 2020 – Present',
                  description:
                    'Worked on the frontend\nThe backend was also my responsibility\nSometimes did code reviews\nWas part of the deployment team\nAttended meetings',
                },
              ],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
  });

  it('handles bullet markers (-, *, •)', () => {
    const result = checkActionVerbs(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [
                {
                  title: 'Dev',
                  company: 'Corp',
                  displayDate: 'Jan 2020 – Present',
                  description:
                    '- Led the frontend team on major initiative\n• Developed microservices architecture for the platform\n* Built a CI/CD pipeline from scratch',
                },
              ],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('pass');
  });

  it('warns when no experience bullets exist', () => {
    const result = checkActionVerbs(
      makeInput({
        resumeData: {
          sections: [{ type: 'skills', label: 'Skills', items: [] }],
        },
      })
    );
    expect(result.status).toBe('warning');
  });
});

// ── F1: Font Safety ──────────────────────────────────────────────

describe('F1: checkFontSafety', () => {
  it('passes for safe fonts', () => {
    const result = checkFontSafety(makeInput());
    expect(result.id).toBe('F1');
    expect(result.status).toBe('pass');
  });

  it('warns for non-standard fonts', () => {
    const result = checkFontSafety(
      makeInput({
        resumeData: { style: { ...baseStyle, fontFamily: 'Comic Sans MS, cursive' } },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('Comic Sans MS');
  });

  it('handles quoted font names', () => {
    const result = checkFontSafety(
      makeInput({
        resumeData: { style: { ...baseStyle, fontFamily: '"Open Sans", sans-serif' } },
      })
    );
    expect(result.status).toBe('pass');
  });
});

// ── F2: Font Size ────────────────────────────────────────────────

describe('F2: checkFontSize', () => {
  it('passes for 10pt', () => {
    const result = checkFontSize(makeInput());
    expect(result.id).toBe('F2');
    expect(result.status).toBe('pass');
  });

  it('warns for font size below 9pt', () => {
    const result = checkFontSize(
      makeInput({ resumeData: { style: { ...baseStyle, fontSize: '8pt' } } })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('too small');
  });

  it('warns for font size above 12pt', () => {
    const result = checkFontSize(
      makeInput({ resumeData: { style: { ...baseStyle, fontSize: '14pt' } } })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('larger');
  });

  it('warns for non-pt unit', () => {
    const result = checkFontSize(
      makeInput({ resumeData: { style: { ...baseStyle, fontSize: '16px' } } })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('non-standard unit');
  });
});

// ── F3: Page Length ──────────────────────────────────────────────

describe('F3: checkPageLength', () => {
  it('passes for reasonably-sized content', () => {
    const result = checkPageLength(makeInput());
    expect(result.id).toBe('F3');
    expect(result.status).toBe('pass');
  });

  it('warns for excessively long content', () => {
    const longDescription = 'A'.repeat(1000);
    const result = checkPageLength(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [
                {
                  title: 'Dev',
                  company: 'Corp',
                  displayDate: '2020',
                  description: longDescription,
                },
                {
                  title: 'Dev2',
                  company: 'Corp2',
                  displayDate: '2019',
                  description: longDescription,
                },
                {
                  title: 'Dev3',
                  company: 'Corp3',
                  displayDate: '2018',
                  description: longDescription,
                },
                {
                  title: 'Dev4',
                  company: 'Corp4',
                  displayDate: '2017',
                  description: longDescription,
                },
                {
                  title: 'Dev5',
                  company: 'Corp5',
                  displayDate: '2016',
                  description: longDescription,
                },
              ],
            },
          ],
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.message).toContain('exceeds');
  });
});

// ── F4: Special Characters ──────────────────────────────────────

describe('F4: checkSpecialCharacters', () => {
  it('passes for clean text', () => {
    const result = checkSpecialCharacters(makeInput());
    expect(result.id).toBe('F4');
    expect(result.status).toBe('pass');
  });

  it('warns for fancy quotes', () => {
    const result = checkSpecialCharacters(
      makeInput({
        resumeData: {
          summary: 'I\u201Cdesigned\u201D a system that works.',
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.details?.[0]).toContain('fancy quote');
  });

  it('warns for em dashes', () => {
    const result = checkSpecialCharacters(
      makeInput({
        resumeData: {
          summary: 'Led team \u2014 delivered results \u2013 on time.',
        },
      })
    );
    expect(result.status).toBe('warning');
    expect(result.details?.[0]).toContain('dash');
  });
});

// ── runChecks Orchestrator ───────────────────────────────────────

describe('runChecks', () => {
  it('returns all non-keyword checks when no JD analysis', () => {
    const result = runChecks(makeInput());
    expect(result.totalChecks).toBe(ATS_CHECKS_WITHOUT_JD);
    expect(result.categories).toHaveLength(3); // parsability, readability, format
    expect(result.categories.find((c) => c.category === 'keywords')).toBeUndefined();
  });

  it('includes keyword checks when JD analysis is provided', () => {
    const result = runChecks(
      makeInput({
        jdAnalysis: {
          coverageScore: 0.8,
          matchedKeywords: ['React', 'TypeScript', 'Node.js'],
          missingKeywords: ['Go'],
        },
      })
    );
    expect(result.totalChecks).toBe(ATS_TOTAL_CHECKS);
    expect(result.categories).toHaveLength(4);
    expect(result.categories.find((c) => c.category === 'keywords')).toBeDefined();
  });

  it('computes aggregate score correctly', () => {
    const result = runChecks(makeInput());
    // Score should be between 0 and 100
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    // Verify score formula: (passed * 1 + warned * 0.5) / total * 100
    const expected = Math.round(
      ((result.totalPassed + result.totalWarned * 0.5) / result.totalChecks) * 100
    );
    expect(result.score).toBe(expected);
  });

  it('maintains category order: parsability, keywords, readability, format', () => {
    const result = runChecks(
      makeInput({
        jdAnalysis: {
          coverageScore: 0.8,
          matchedKeywords: ['React', 'TypeScript', 'Node.js'],
          missingKeywords: [],
        },
      })
    );
    const categoryOrder = result.categories.map((c) => c.category);
    expect(categoryOrder).toEqual(['parsability', 'keywords', 'readability', 'format']);
  });

  it('category summaries sum correctly', () => {
    const result = runChecks(makeInput());
    for (const cat of result.categories) {
      expect(cat.passed + cat.warned + cat.failed).toBe(cat.total);
      expect(cat.checks).toHaveLength(cat.total);
    }
    expect(result.totalPassed + result.totalWarned + result.totalFailed).toBe(result.totalChecks);
  });

  it('includes checkedAt timestamp', () => {
    const result = runChecks(makeInput());
    expect(result.checkedAt).toBeTruthy();
    // Should be a valid ISO date string
    expect(new Date(result.checkedAt).toISOString()).toBe(result.checkedAt);
  });

  it('handles edge case: empty sections array', () => {
    const result = runChecks(makeInput({ resumeData: { sections: [] } }));
    expect(result.totalChecks).toBeGreaterThan(0);
    // Should not throw
  });

  it('handles edge case: missing summary with JD analysis', () => {
    const result = runChecks(
      makeInput({
        resumeData: { summary: null },
        jdAnalysis: {
          coverageScore: 0.5,
          matchedKeywords: ['React'],
          missingKeywords: ['Go'],
        },
      })
    );
    expect(result.totalChecks).toBe(ATS_TOTAL_CHECKS);
    // K3 should warn about no summary
    const k3 = result.categories
      .find((c) => c.category === 'keywords')
      ?.checks.find((c) => c.id === 'K3');
    expect(k3?.status).toBe('warning');
  });

  it('handles edge case: experience items with empty description', () => {
    const result = runChecks(
      makeInput({
        resumeData: {
          sections: [
            {
              type: 'experience',
              label: 'Experience',
              items: [
                {
                  title: 'Dev',
                  company: 'Corp',
                  displayDate: 'Jan 2020 – Present',
                  description: '',
                },
              ],
            },
          ],
        },
      })
    );
    // Should not throw — empty description produces 0 bullets
    expect(result.totalChecks).toBeGreaterThan(0);
  });
});

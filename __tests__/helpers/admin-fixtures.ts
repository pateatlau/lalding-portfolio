import type {
  Profile,
  ProfileStat,
  Education,
  Experience,
  Project,
  ProjectCategory,
  SkillGroupWithSkills,
  ResumeTemplate,
  ResumeConfig,
  ResumeVersion,
  JdAnalysisResult,
} from '@/lib/supabase/types';
import type { CmsDataForAnalysis } from '@/lib/resume-builder/jd-analyzer';
import type { ResumeDownloadEntry, VisitorEntry } from '@/actions/admin';
import type { ResumeData } from '@/components/resume-templates/types';
import type { AtsCheckResult } from '@/lib/resume-builder/ats-checker';

export const mockProfile: Profile = {
  id: 'profile-1',
  singleton: true,
  full_name: 'John Doe',
  short_name: 'John',
  job_title: 'Software Engineer',
  tagline: 'Building great software',
  typewriter_titles: ['Developer', 'Architect'],
  email: 'john@example.com',
  phone: '+1234567890',
  location: 'New York',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  github_url: 'https://github.com/johndoe',
  resume_url: 'resume.pdf',
  website_url: null,
  about_tech_stack: 'React, TypeScript',
  about_current_focus: 'Next.js',
  about_beyond_code: 'Music',
  about_expertise: ['Frontend', 'Backend'],
  footer_text: 'Built with love',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockStats: ProfileStat[] = [
  { id: 'stat-1', value: 15, suffix: '+', label: 'Years Experience', sort_order: 0 },
  { id: 'stat-2', value: 50, suffix: '+', label: 'Projects', sort_order: 1 },
];

export const mockExperiences: Experience[] = [
  {
    id: 'exp-1',
    title: 'Senior Dev',
    company: 'Acme Corp',
    description: 'Led team',
    icon: 'work',
    start_date: '2020-01-01',
    end_date: null,
    display_date: 'Jan 2020 - Present',
    company_logo_url: null,
    sort_order: 0,
  },
  {
    id: 'exp-2',
    title: 'Dev',
    company: 'Startup Inc',
    description: 'Built features',
    icon: 'react',
    start_date: '2018-01-01',
    end_date: '2019-12-31',
    display_date: 'Jan 2018 - Dec 2019',
    company_logo_url: '/companies/startup.webp',
    sort_order: 1,
  },
];

export const mockEducations: Education[] = [
  {
    id: 'edu-1',
    institution: 'University of Example',
    degree: 'Bachelor of Technology',
    field_of_study: 'Computer Science',
    description: 'Graduated with honors',
    start_date: '2011-08-01',
    end_date: '2015-05-31',
    display_date: '2011 - 2015',
    institution_logo_url: null,
    sort_order: 0,
  },
  {
    id: 'edu-2',
    institution: 'Online Academy',
    degree: 'Certificate',
    field_of_study: null,
    description: null,
    start_date: '2016-01-01',
    end_date: '2016-06-30',
    display_date: '2016',
    institution_logo_url: '/companies/academy.webp',
    sort_order: 1,
  },
];

export const mockCategories: ProjectCategory[] = [
  { id: 'cat-1', name: 'Web', sort_order: 0 },
  { id: 'cat-2', name: 'Mobile', sort_order: 1 },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'Project Alpha',
    description: 'A great project',
    tags: ['React', 'TypeScript', 'Next.js', 'Tailwind'],
    image_url: '/images/alpha.png',
    demo_video_url: null,
    source_code_url: 'https://github.com/alpha',
    live_site_url: 'https://alpha.dev',
    category_id: 'cat-1',
    sort_order: 0,
  },
  {
    id: 'proj-2',
    title: 'Project Beta',
    description: 'Another project',
    tags: ['Python', 'Django'],
    image_url: null,
    demo_video_url: null,
    source_code_url: null,
    live_site_url: null,
    category_id: null,
    sort_order: 1,
  },
];

export const mockSkillGroups: SkillGroupWithSkills[] = [
  {
    id: 'sg-1',
    category: 'Frontend',
    sort_order: 0,
    skills: [
      { id: 'sk-1', name: 'React', group_id: 'sg-1', sort_order: 0 },
      { id: 'sk-2', name: 'TypeScript', group_id: 'sg-1', sort_order: 1 },
    ],
  },
  {
    id: 'sg-2',
    category: 'Backend',
    sort_order: 1,
    skills: [{ id: 'sk-3', name: 'Node.js', group_id: 'sg-2', sort_order: 0 }],
  },
];

export const mockDownloads: ResumeDownloadEntry[] = [
  {
    id: 'dl-1',
    downloadedAt: new Date(Date.now() - 3600000).toISOString(),
    visitorName: 'Jane Smith',
    visitorEmail: 'jane@example.com',
    visitorCompany: 'TechCo',
  },
  {
    id: 'dl-2',
    downloadedAt: new Date(Date.now() - 86400000).toISOString(),
    visitorName: null,
    visitorEmail: null,
    visitorCompany: null,
  },
];

export const mockVisitors: VisitorEntry[] = [
  {
    id: 'v-1',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    avatarUrl: 'https://example.com/jane.jpg',
    provider: 'google',
    company: 'TechCo',
    role: 'Engineer',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    downloadCount: 3,
  },
  {
    id: 'v-2',
    fullName: 'Bob Johnson',
    email: 'bob@example.com',
    avatarUrl: null,
    provider: 'github',
    company: null,
    role: null,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    downloadCount: 0,
  },
  {
    id: 'v-3',
    fullName: null,
    email: 'anonymous@example.com',
    avatarUrl: null,
    provider: 'google',
    company: 'StartupXYZ',
    role: 'CTO',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    downloadCount: 1,
  },
];

// ── Resume Builder fixtures ───────────────────────────────────

export const mockResumeTemplate: ResumeTemplate = {
  id: 'tmpl-1',
  registry_key: 'professional',
  name: 'Professional',
  description: 'Clean professional template',
  thumbnail_url: null,
  is_builtin: true,
  page_size: 'A4',
  columns: 1,
  style_config: {
    primaryColor: '#1a1a1a',
    accentColor: '#2bbcb3',
    fontFamily: 'Open Sans, sans-serif',
    fontSize: '10pt',
    lineHeight: '1.4',
    margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
  },
  sort_order: 0,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockResumeConfig: ResumeConfig = {
  id: 'cfg-1',
  name: 'Default Resume',
  description: 'Main resume config',
  template_id: 'tmpl-1',
  sections: [
    { section: 'experience', label: 'Experience', enabled: true, sort_order: 0, itemIds: [] },
    { section: 'skills', label: 'Skills', enabled: true, sort_order: 1, itemIds: [] },
    { section: 'projects', label: 'Projects', enabled: false, sort_order: 2, itemIds: [] },
  ],
  style_overrides: {},
  custom_summary: 'Experienced engineer',
  job_description: null,
  jd_keywords: null,
  jd_coverage_score: null,
  jd_analysis: null,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockResumeVersion: ResumeVersion = {
  id: 'ver-1',
  config_id: 'cfg-1',
  template_id: 'tmpl-1',
  config_snapshot: {},
  pdf_storage_path: 'generated/cfg-1/ver-1.pdf',
  pdf_file_size: 102400,
  page_count: 1,
  generation_time_ms: 2500,
  is_active: true,
  created_at: '2025-01-15T12:00:00Z',
};

// ── JD Analysis fixtures ──────────────────────────────────────

export const mockCmsDataForAnalysis: CmsDataForAnalysis = {
  experiences: [
    {
      id: 'exp-1',
      title: 'Senior Frontend Engineer',
      company: 'TechCorp',
      description:
        'Led React and TypeScript development. Built performant UI components with Next.js. Mentored junior developers.',
    },
    {
      id: 'exp-2',
      title: 'Full Stack Developer',
      company: 'StartupCo',
      description:
        'Developed REST APIs with Node.js and PostgreSQL. Implemented CI/CD pipelines using GitHub Actions.',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'E-commerce Platform',
      description:
        'Full-stack e-commerce solution with payment integration and real-time inventory.',
      tags: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Docker'],
    },
    {
      id: 'proj-2',
      title: 'Analytics Dashboard',
      description: 'Data visualization dashboard with D3.js charts and WebSocket live updates.',
      tags: ['TypeScript', 'D3.js', 'WebSocket', 'Python'],
    },
  ],
  skillGroups: [
    {
      id: 'sg-1',
      category: 'Frontend',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'HTML', 'CSS'],
    },
    {
      id: 'sg-2',
      category: 'Backend',
      skills: ['Node.js', 'PostgreSQL', 'REST APIs', 'GraphQL'],
    },
    {
      id: 'sg-3',
      category: 'DevOps',
      skills: ['Docker', 'Kubernetes', 'GitHub Actions', 'AWS'],
    },
  ],
};

export const mockJdAnalysisResult: JdAnalysisResult = {
  matchedKeywords: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  missingKeywords: ['Go', 'Redis', 'Terraform'],
  suggestions: [
    {
      type: 'include_experience',
      itemId: 'exp-1',
      reason: 'Matches keyword "React" — consider including "Senior Frontend Engineer at TechCorp"',
    },
    {
      type: 'include_skill_group',
      itemId: 'sg-3',
      reason: 'Matches keyword "Docker" — consider including "DevOps"',
    },
  ],
};

// ── ATS Checker fixtures ──────────────────────────────────────

/** ResumeData designed to trigger a mix of pass, warning, and fail statuses across ATS checks. */
export const mockResumeDataForAtsCheck: ResumeData = {
  profile: {
    fullName: 'John Doe',
    jobTitle: 'Software Engineer',
    email: 'john@example.com',
    phone: null, // P1: warning (missing phone)
    location: 'New York, NY',
    websiteUrl: null,
    linkedinUrl: null,
    githubUrl: null,
  },
  summary: 'Short summary.', // R6: warning (too short, < 100 chars); P5: pass
  sections: [
    {
      type: 'experience',
      label: 'Experience',
      items: [
        {
          title: 'Senior Engineer',
          company: 'TechCorp',
          displayDate: 'Jan 2020 \u2013 Present',
          description:
            'Led development of microservices architecture serving 1M+ users\nWas responsible for code reviews and team coordination\nImplemented CI/CD pipeline reducing deployment time by 60%',
        },
        {
          title: 'Software Developer',
          company: 'StartupCo',
          displayDate: 'Mar 2017 \u2013 Dec 2019',
          description:
            'Developed RESTful APIs handling 50K requests per day\nWorked on frontend features using React and TypeScript\nOptimized database queries improving response time by 40%',
        },
      ],
    },
    {
      type: 'skills',
      label: 'Technical Skills',
      items: [
        {
          category: 'Frontend',
          skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'HTML'],
        },
        { category: 'Backend', skills: ['Node.js', 'Python', 'PostgreSQL'] },
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
          displayDate: 'Aug 2013 \u2013 May 2017',
          description: null,
        },
      ],
    },
  ],
  style: {
    primaryColor: '#1a1a1a',
    accentColor: '#2bbcb3',
    fontFamily: 'Open Sans, sans-serif',
    headingFontFamily: 'Open Sans, sans-serif',
    fontSize: '10pt',
    lineHeight: '1.4',
    margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
  },
  pageSize: 'A4',
};

/** Complete AtsCheckResult with a mix of pass, warning, and fail statuses. */
export const mockAtsCheckResult: AtsCheckResult = {
  score: 69,
  categories: [
    {
      category: 'parsability',
      label: 'Parsability',
      passed: 4,
      warned: 2,
      failed: 1,
      total: 7,
      checks: [
        {
          id: 'P1',
          category: 'parsability',
          name: 'Contact info present',
          status: 'warning',
          message: 'Email found. Missing: phone.',
        },
        {
          id: 'P2',
          category: 'parsability',
          name: 'Standard section headings',
          status: 'pass',
          message: 'All section headings are ATS-recognized.',
        },
        {
          id: 'P3',
          category: 'parsability',
          name: 'Date format consistency',
          status: 'pass',
          message: 'All dates use a consistent, recognized format.',
        },
        {
          id: 'P4',
          category: 'parsability',
          name: 'No empty sections',
          status: 'pass',
          message: 'All sections contain at least one item.',
        },
        {
          id: 'P5',
          category: 'parsability',
          name: 'Summary present',
          status: 'pass',
          message: 'Summary section is present.',
        },
        {
          id: 'P6',
          category: 'parsability',
          name: 'Template ATS safety',
          status: 'fail',
          message: 'HTML contains ATS-unfriendly elements: <table>.',
          details: ['<table> may cause parsing issues in ATS systems'],
        },
        {
          id: 'P7',
          category: 'parsability',
          name: 'No header/footer content',
          status: 'warning',
          message: 'Fixed or absolutely positioned elements detected.',
          details: [
            'Found position: absolute outside small container \u2014 content may shift in ATS parsing',
          ],
        },
      ],
    },
    {
      category: 'keywords',
      label: 'Keyword Optimization',
      passed: 1,
      warned: 2,
      failed: 0,
      total: 3,
      checks: [
        {
          id: 'K1',
          category: 'keywords',
          name: 'JD keyword coverage',
          status: 'pass',
          message: 'Keyword coverage is 75% \u2014 strong match with the job description.',
        },
        {
          id: 'K2',
          category: 'keywords',
          name: 'Missing keywords',
          status: 'warning',
          message: '3 keyword(s) from the job description are missing.',
          details: ['Go', 'Redis', 'Terraform'],
        },
        {
          id: 'K3',
          category: 'keywords',
          name: 'Keywords in summary',
          status: 'warning',
          message: 'Only 0 matched keyword(s) in the summary. Aim for at least 3.',
          details: ['No matched keywords found in summary'],
        },
      ],
    },
    {
      category: 'readability',
      label: 'Readability & Structure',
      passed: 4,
      warned: 3,
      failed: 0,
      total: 7,
      checks: [
        {
          id: 'R1',
          category: 'readability',
          name: 'Bullet point length',
          status: 'pass',
          message: 'All bullet points are within the ideal 30\u2013200 character range.',
        },
        {
          id: 'R2',
          category: 'readability',
          name: 'Quantified achievements',
          status: 'pass',
          message: '50% of bullets contain quantified metrics (3/6).',
        },
        {
          id: 'R3',
          category: 'readability',
          name: 'Section count',
          status: 'pass',
          message: 'Resume has 3 sections.',
        },
        {
          id: 'R4',
          category: 'readability',
          name: 'Experience section position',
          status: 'pass',
          message: 'Experience section is at position 1 \u2014 prominently placed.',
        },
        {
          id: 'R5',
          category: 'readability',
          name: 'Skills density',
          status: 'warning',
          message: 'Only 8 skill(s) listed. Consider adding more to improve keyword matching.',
        },
        {
          id: 'R6',
          category: 'readability',
          name: 'Summary length',
          status: 'warning',
          message: 'Summary is 16 characters \u2014 too short. Aim for 100\u2013400 characters.',
        },
        {
          id: 'R7',
          category: 'readability',
          name: 'Action verbs in bullets',
          status: 'warning',
          message: 'Only 50% of bullets start with action verbs (3/6). Aim for at least 60%.',
          details: [
            '"Was responsible for code reviews and team coordination" \u2014 Senior Engineer',
            '"Worked on frontend features using React and TypeScript" \u2014 Software Developer',
          ],
        },
      ],
    },
    {
      category: 'format',
      label: 'Format Compliance',
      passed: 4,
      warned: 0,
      failed: 0,
      total: 4,
      checks: [
        {
          id: 'F1',
          category: 'format',
          name: 'Font is web-safe/embeddable',
          status: 'pass',
          message: '"Open Sans" is a safe, widely supported font.',
        },
        {
          id: 'F2',
          category: 'format',
          name: 'Font size readable',
          status: 'pass',
          message: 'Font size 10pt is within the ideal 9\u201312pt range.',
        },
        {
          id: 'F3',
          category: 'format',
          name: 'Page length estimate',
          status: 'pass',
          message: 'Content length (~1200 chars) should fit within a standard resume length.',
        },
        {
          id: 'F4',
          category: 'format',
          name: 'Special characters',
          status: 'pass',
          message: 'No problematic special characters found.',
        },
      ],
    },
  ],
  totalPassed: 13,
  totalWarned: 7,
  totalFailed: 1,
  totalChecks: 21,
  checkedAt: '2025-06-15T12:00:00.000Z',
};

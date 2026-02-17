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
} from '@/lib/supabase/types';
import type { ResumeDownloadEntry, VisitorEntry } from '@/actions/admin';

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

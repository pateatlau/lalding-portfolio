import type {
  Profile,
  ProfileStat,
  Experience,
  Project,
  ProjectCategory,
  SkillGroupWithSkills,
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

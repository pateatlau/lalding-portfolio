import { createClient } from './server';
import type {
  Profile,
  ProfileStat,
  NavLink,
  Company,
  Experience,
  ProjectCategory,
  Project,
  SkillGroupWithSkills,
} from './types';
import type { ProfileData } from '@/lib/types';

const STATIC_PROFILE: ProfileData = {
  fullName: 'Laldingliana Tlau Vantawl',
  shortName: 'Lalding',
  jobTitle: 'Full-stack Tech Lead',
  tagline:
    'Building scalable web applications with expertise in React, Next.js, TypeScript, and modern web technologies.',
  typewriterTitles: [
    'Full-stack Tech Lead',
    'React Specialist',
    '15+ Years Experience',
    'Cross-platform Developer',
  ],
  email: 'laldingliana.tv@gmail.com',
  phone: '+91 9972228955',
  location: 'Bangalore, India',
  linkedinUrl: 'https://www.linkedin.com/in/laldingliana-tv/',
  githubUrl: 'https://github.com/pateatlau',
  resumeUrl: '/lalding.pdf',
  aboutTechStack:
    'My core stack is the React Ecosystem and Node.js. Experienced in full-stack development with Next.js and MERN stack, with additional expertise in monorepos, micro frontends, and cross-platform development across web, iOS, and Android.',
  aboutCurrentFocus:
    'Looking for a Technical Lead or Architect role. Currently deepening expertise in AI tech stack.',
  aboutBeyondCode:
    "When I'm not working, I enjoy playing chess, reading books, and contributing to society. I love learning new things and continuously improving my tech stack.",
  aboutExpertise: [
    'Monorepos & NX',
    'Micro Frontends',
    'Module Federation',
    'Cross-platform (RN + Web)',
  ],
  footerText:
    'built with React & Next.js (App Router & Server Actions), TypeScript, Tailwind CSS, Framer Motion, React Email & Resend, Vercel hosting.',
};

function mapDbProfile(db: Profile): ProfileData {
  return {
    fullName: db.full_name,
    shortName: db.short_name,
    jobTitle: db.job_title,
    tagline: db.tagline ?? '',
    typewriterTitles: db.typewriter_titles,
    email: db.email,
    phone: db.phone ?? '',
    location: db.location ?? '',
    linkedinUrl: db.linkedin_url ?? '',
    githubUrl: db.github_url ?? '',
    resumeUrl: db.resume_url ?? '/lalding.pdf',
    aboutTechStack: db.about_tech_stack ?? '',
    aboutCurrentFocus: db.about_current_focus ?? '',
    aboutBeyondCode: db.about_beyond_code ?? '',
    aboutExpertise: db.about_expertise ?? [],
    footerText: db.footer_text ?? '',
  };
}

export async function getProfileData(): Promise<ProfileData> {
  const db = await getProfile();
  return db ? mapDbProfile(db) : STATIC_PROFILE;
}

// Fallback: if Supabase is not configured, log a warning.
// The calling code in app/page.tsx falls back to lib/data.ts.
function isSupabaseConfigured(): boolean {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn(
      '⚠️  Supabase not configured (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing). Using static data fallback.'
    );
    return false;
  }
  return true;
}

export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from('profile').select('*').single();
  if (error) {
    console.error('getProfile error:', error.message);
    return null;
  }
  return data;
}

export async function getProfileStats(): Promise<ProfileStat[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profile_stats')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getProfileStats error:', error.message);
    return null;
  }
  return data;
}

export async function getNavLinks(): Promise<NavLink[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('nav_links')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getNavLinks error:', error.message);
    return null;
  }
  return data;
}

export async function getCompanies(): Promise<Company[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getCompanies error:', error.message);
    return null;
  }
  return data;
}

export async function getExperiences(): Promise<Experience[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getExperiences error:', error.message);
    return null;
  }
  return data;
}

export async function getProjectCategories(): Promise<ProjectCategory[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getProjectCategories error:', error.message);
    return null;
  }
  return data;
}

export async function getProjects(): Promise<Project[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('getProjects error:', error.message);
    return null;
  }
  return data;
}

export async function getSkillGroups(): Promise<SkillGroupWithSkills[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data: groups, error: groupsError } = await supabase
    .from('skill_groups')
    .select('*')
    .order('sort_order', { ascending: true });
  if (groupsError) {
    console.error('getSkillGroups error:', groupsError.message);
    return null;
  }

  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('*')
    .order('sort_order', { ascending: true });
  if (skillsError) {
    console.error('getSkillGroups (skills) error:', skillsError.message);
    return null;
  }

  return groups.map((group) => ({
    ...group,
    skills: skills.filter((skill) => skill.group_id === group.id),
  }));
}

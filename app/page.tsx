import About from '@/components/about';
import Contact from '@/components/contact';
import Experience from '@/components/experience';
import Intro from '@/components/intro';
import Projects from '@/components/projects';
import SectionDivider from '@/components/section-divider';
import Skills from '@/components/skills';
import SectionAnimation from '@/components/section-animation';
import {
  getProfileData,
  getProfileStats,
  getCompanies,
  getExperiences,
  getProjectCategories,
  getProjects,
  getSkillGroups,
} from '@/lib/supabase/queries';
import {
  companiesSliderData,
  experiencesData,
  projectCategories as staticProjectCategories,
  projectsData,
  skillsGrouped,
} from '@/lib/data';
import type { ProfileStatData, ExperienceData, ProjectData } from '@/lib/types';

export const revalidate = 3600;

export default async function Home() {
  // Fetch from Supabase, fall back to static data if not configured
  const [profile, dbStats, dbCompanies, dbExperiences, dbCategories, dbProjects, dbSkillGroups] =
    await Promise.all([
      getProfileData(),
      getProfileStats(),
      getCompanies(),
      getExperiences(),
      getProjectCategories(),
      getProjects(),
      getSkillGroups(),
    ]);

  // --- Stats ---
  const stats: ProfileStatData[] = dbStats
    ? dbStats.map((s) => ({ value: s.value, suffix: s.suffix ?? '+', label: s.label }))
    : [
        { value: 15, suffix: '+', label: 'Years Experience' },
        { value: 50, suffix: '+', label: 'Projects Delivered' },
        { value: 8, suffix: '+', label: 'Companies' },
        { value: 10, suffix: '+', label: 'Teams Led' },
      ];

  // --- Companies ---
  const companies = dbCompanies
    ? dbCompanies.map((c) => ({ name: c.name, logo: c.logo_url }))
    : companiesSliderData.map((c) => ({ name: c.name, logo: c.logo }));

  // --- Experiences ---
  const experiences: ExperienceData[] = dbExperiences
    ? dbExperiences.map((e) => ({
        title: e.title,
        company: e.company,
        description: e.description,
        icon: e.icon,
        date: e.display_date,
        companyLogo: e.company_logo_url ?? '',
      }))
    : experiencesData.map((e) => {
        const iconType =
          typeof e.icon.type === 'function' ? (e.icon.type as { name?: string }).name : '';
        return {
          title: e.title,
          company: e.location,
          description: e.description,
          icon: iconType === 'FaReact' ? 'react' : 'work',
          date: e.date,
          companyLogo: e.companyLogo,
        };
      });

  // --- Project categories ---
  const categories = dbCategories ? dbCategories.map((c) => c.name) : [...staticProjectCategories];

  // --- Projects ---
  const categoryMap = dbCategories ? new Map(dbCategories.map((c) => [c.id, c.name])) : null;

  const projects: ProjectData[] = dbProjects
    ? dbProjects.map((p) => ({
        title: p.title,
        description: p.description,
        tags: [...p.tags],
        imageUrl: p.image_url ?? '/corpcomment.png',
        demoVideoUrl: p.demo_video_url ?? null,
        sourceCode: p.source_code_url ?? '',
        liveSite: p.live_site_url ?? '',
        category: categoryMap?.get(p.category_id ?? '') ?? 'All',
      }))
    : projectsData.map((p) => ({
        title: p.title,
        description: p.description,
        tags: [...p.tags],
        imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : (p.imageUrl as { src: string }).src,
        demoVideoUrl: null,
        sourceCode: p.sourceCode,
        liveSite: p.liveSite,
        category: p.category,
      }));

  // --- Skills ---
  const skillGroups = dbSkillGroups
    ? dbSkillGroups.map((g) => ({
        category: g.category,
        skills: g.skills.map((s) => s.name),
      }))
    : skillsGrouped.map((g) => ({
        category: g.category,
        skills: [...g.skills],
      }));

  return (
    <main className="flex flex-col items-center px-4">
      <Intro profile={profile} />
      <SectionDivider />
      <SectionAnimation>
        <About profile={profile} stats={stats} />
      </SectionAnimation>
      <SectionAnimation>
        <Projects projects={projects} categories={categories} />
      </SectionAnimation>
      <SectionAnimation>
        <Skills skillGroups={skillGroups} />
      </SectionAnimation>
      <SectionAnimation>
        <Experience experiences={experiences} companies={companies} />
      </SectionAnimation>
      <SectionAnimation>
        <Contact profile={profile} />
      </SectionAnimation>
    </main>
  );
}

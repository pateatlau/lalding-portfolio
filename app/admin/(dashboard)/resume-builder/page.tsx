import { getExperiences, getProjects, getSkillGroups } from '@/lib/supabase/queries';
import { getResumeConfigs, getResumeTemplates } from '@/actions/resume-builder';
import ResumeBuilderTabs from '@/components/admin/resume-builder/resume-builder-tabs';

export default async function ResumeBuilderPage() {
  const [experiences, projects, skillGroups, configsResult, templatesResult] = await Promise.all([
    getExperiences(),
    getProjects(),
    getSkillGroups(),
    getResumeConfigs(),
    getResumeTemplates(),
  ]);

  if (!experiences || !projects || !skillGroups) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load CMS data.</p>
      </div>
    );
  }

  return (
    <ResumeBuilderTabs
      experiences={experiences}
      projects={projects}
      skillGroups={skillGroups}
      configs={configsResult.data ?? []}
      templates={templatesResult.data ?? []}
    />
  );
}

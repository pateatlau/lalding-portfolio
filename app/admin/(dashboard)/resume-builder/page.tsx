import { getEducations, getExperiences, getProjects, getSkillGroups } from '@/lib/supabase/queries';
import { getResumeConfigs, getResumeTemplates } from '@/actions/resume-builder';
import ResumeBuilderTabs from '@/components/admin/resume-builder/resume-builder-tabs';

export default async function ResumeBuilderPage() {
  const [educations, experiences, projects, skillGroups, configsResult, templatesResult] =
    await Promise.all([
      getEducations(),
      getExperiences(),
      getProjects(),
      getSkillGroups(),
      getResumeConfigs(),
      getResumeTemplates(),
    ]);

  if (!educations || !experiences || !projects || !skillGroups) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load CMS data.</p>
      </div>
    );
  }

  return (
    <ResumeBuilderTabs
      educations={educations}
      experiences={experiences}
      projects={projects}
      skillGroups={skillGroups}
      configs={configsResult.data ?? []}
      templates={templatesResult.data ?? []}
    />
  );
}

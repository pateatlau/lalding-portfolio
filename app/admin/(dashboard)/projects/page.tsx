import { getProjects, getProjectCategories } from '@/lib/supabase/queries';
import ProjectsEditor from '@/components/admin/projects-editor';

export default async function ProjectsEditorPage() {
  const [projects, categories] = await Promise.all([getProjects(), getProjectCategories()]);

  if (!projects) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load projects data.</p>
      </div>
    );
  }

  return <ProjectsEditor projects={projects} categories={categories ?? []} />;
}

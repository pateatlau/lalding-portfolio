import { getExperiences } from '@/lib/supabase/queries';
import ExperienceEditor from '@/components/admin/experience-editor';

export default async function ExperienceEditorPage() {
  const experiences = await getExperiences();

  if (!experiences) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load experience data.</p>
      </div>
    );
  }

  return <ExperienceEditor experiences={experiences} />;
}

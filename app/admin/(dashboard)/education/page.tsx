import { getEducations } from '@/lib/supabase/queries';
import EducationEditor from '@/components/admin/education-editor';

export default async function EducationEditorPage() {
  const educations = await getEducations();

  if (!educations) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load education data.</p>
      </div>
    );
  }

  return <EducationEditor educations={educations} />;
}

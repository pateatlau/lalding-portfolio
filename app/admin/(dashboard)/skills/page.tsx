import { getSkillGroups } from '@/lib/supabase/queries';
import SkillsEditor from '@/components/admin/skills-editor';

export default async function SkillsEditorPage() {
  const groups = await getSkillGroups();

  if (!groups) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load skills data.</p>
      </div>
    );
  }

  return <SkillsEditor groups={groups} />;
}

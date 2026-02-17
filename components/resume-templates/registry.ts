import type { ResumeTemplateComponent } from './types';

// Keys match the `registry_key` column in the `resume_templates` DB table.
const templateRegistry: Record<string, () => Promise<{ default: ResumeTemplateComponent }>> = {
  professional: () => import('./professional'),
};

// Accepts a registry_key (from resume_templates.registry_key), not a UUID.
export async function getTemplateComponent(
  registryKey: string
): Promise<ResumeTemplateComponent | null> {
  const loader = templateRegistry[registryKey];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}

export function getAvailableRegistryKeys(): string[] {
  return Object.keys(templateRegistry);
}

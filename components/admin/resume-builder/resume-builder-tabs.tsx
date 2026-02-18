'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ConfigList from './config-list';
import ResumeComposer from './resume-composer';
import ResumePreview from './resume-preview';
import AtsCheckerPanel from './ats-checker-panel';
import TemplateManager from './template-manager';
import VersionHistory from './version-history';
import type { ResumeConfigListItem, TemplateListItem } from '@/actions/resume-builder';
import type {
  Education,
  Experience,
  Project,
  SkillGroupWithSkills,
  ResumeConfig,
} from '@/lib/supabase/types';

type ResumeBuilderTabsProps = {
  educations: Education[];
  experiences: Experience[];
  projects: Project[];
  skillGroups: SkillGroupWithSkills[];
  configs: ResumeConfigListItem[];
  templates: TemplateListItem[];
  llmConfigured: boolean;
};

export default function ResumeBuilderTabs({
  educations,
  experiences,
  projects,
  skillGroups,
  configs: initialConfigs,
  templates,
  llmConfigured,
}: ResumeBuilderTabsProps) {
  const [configs, setConfigs] = useState(initialConfigs);
  const [templateList, setTemplateList] = useState(templates);
  const [activeTab, setActiveTab] = useState('configs');
  const [selectedConfig, setSelectedConfig] = useState<ResumeConfig | null>(null);

  function handleSelectConfig(config: ResumeConfig) {
    setSelectedConfig(config);
    setActiveTab('composer');
  }

  function handleConfigsChanged(updated: ResumeConfigListItem[]) {
    setConfigs(updated);
  }

  function handleComposerSaved(updated: ResumeConfig) {
    setSelectedConfig(updated);
    // Update the configs list with new name/description
    setConfigs((prev) =>
      prev.map((c) =>
        c.id === updated.id
          ? {
              ...c,
              name: updated.name,
              description: updated.description,
              updated_at: updated.updated_at,
            }
          : c
      )
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resume Builder</h1>
        <p className="text-muted-foreground text-sm">
          Create and manage tailored resume configurations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configs">Configs</TabsTrigger>
          <TabsTrigger value="composer" disabled={!selectedConfig}>
            Composer
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!selectedConfig}>
            Preview
          </TabsTrigger>
          <TabsTrigger value="ats-check" disabled={!selectedConfig}>
            ATS Check
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history" disabled={!selectedConfig}>
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configs">
          <ConfigList
            configs={configs}
            templates={templateList}
            onSelectConfig={handleSelectConfig}
            onConfigsChanged={handleConfigsChanged}
          />
        </TabsContent>

        <TabsContent value="composer">
          {selectedConfig && (
            <ResumeComposer
              config={selectedConfig}
              educations={educations}
              experiences={experiences}
              projects={projects}
              skillGroups={skillGroups}
              llmConfigured={llmConfigured}
              onSaved={handleComposerSaved}
            />
          )}
        </TabsContent>

        <TabsContent value="preview">
          {selectedConfig && <ResumePreview config={selectedConfig} />}
        </TabsContent>

        <TabsContent value="ats-check">
          {selectedConfig && <AtsCheckerPanel config={selectedConfig} />}
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager templates={templateList} onTemplatesChanged={setTemplateList} />
        </TabsContent>

        <TabsContent value="history">
          {selectedConfig && (
            <VersionHistory configId={selectedConfig.id} configName={selectedConfig.name} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

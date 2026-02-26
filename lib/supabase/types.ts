// Hand-written types matching supabase/schema.sql.
// Can be regenerated via `supabase gen types typescript` once the CLI is set up.
//
// Convention: fields with SQL DEFAULT values are optional in Insert types.

export type Database = {
  public: {
    Tables: {
      profile: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [];
      };
      profile_stats: {
        Row: ProfileStat;
        Insert: ProfileStatInsert;
        Update: Partial<ProfileStatInsert>;
        Relationships: [];
      };
      nav_links: {
        Row: NavLink;
        Insert: NavLinkInsert;
        Update: Partial<NavLinkInsert>;
        Relationships: [];
      };
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: Partial<CompanyInsert>;
        Relationships: [];
      };
      experiences: {
        Row: Experience;
        Insert: ExperienceInsert;
        Update: Partial<ExperienceInsert>;
        Relationships: [];
      };
      educations: {
        Row: Education;
        Insert: EducationInsert;
        Update: Partial<EducationInsert>;
        Relationships: [];
      };
      project_categories: {
        Row: ProjectCategory;
        Insert: ProjectCategoryInsert;
        Update: Partial<ProjectCategoryInsert>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: Partial<ProjectInsert>;
        Relationships: [
          {
            foreignKeyName: 'projects_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'project_categories';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      skill_groups: {
        Row: SkillGroup;
        Insert: SkillGroupInsert;
        Update: Partial<SkillGroupInsert>;
        Relationships: [];
      };
      skills: {
        Row: Skill;
        Insert: SkillInsert;
        Update: Partial<SkillInsert>;
        Relationships: [
          {
            foreignKeyName: 'skills_group_id_fkey';
            columns: ['group_id'];
            referencedRelation: 'skill_groups';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      visitor_profiles: {
        Row: VisitorProfile;
        Insert: VisitorProfileInsert;
        Update: Partial<VisitorProfileInsert>;
        Relationships: [];
      };
      resume_downloads: {
        Row: ResumeDownload;
        Insert: ResumeDownloadInsert;
        Update: Partial<ResumeDownloadInsert>;
        Relationships: [
          {
            foreignKeyName: 'resume_downloads_visitor_id_fkey';
            columns: ['visitor_id'];
            referencedRelation: 'visitor_profiles';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      resume_templates: {
        Row: ResumeTemplate;
        Insert: ResumeTemplateInsert;
        Update: Partial<ResumeTemplateInsert>;
        Relationships: [];
      };
      resume_configs: {
        Row: ResumeConfig;
        Insert: ResumeConfigInsert;
        Update: Partial<ResumeConfigInsert>;
        Relationships: [
          {
            foreignKeyName: 'resume_configs_template_id_fkey';
            columns: ['template_id'];
            referencedRelation: 'resume_templates';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
      resume_versions: {
        Row: ResumeVersion;
        Insert: ResumeVersionInsert;
        Update: Partial<ResumeVersionInsert>;
        Relationships: [
          {
            foreignKeyName: 'resume_versions_config_id_fkey';
            columns: ['config_id'];
            referencedRelation: 'resume_configs';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
          {
            foreignKeyName: 'resume_versions_template_id_fkey';
            columns: ['template_id'];
            referencedRelation: 'resume_templates';
            referencedColumns: ['id'];
            isOneToOne: false;
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
};

// ---------- Row types (all fields present, nullable where applicable) ----------

export type Profile = {
  id: string;
  singleton: boolean;
  full_name: string;
  short_name: string;
  job_title: string;
  tagline: string | null;
  typewriter_titles: string[];
  email: string;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  resume_url: string | null;
  website_url: string | null;
  about_tech_stack: string | null;
  about_current_focus: string | null;
  about_beyond_code: string | null;
  about_expertise: string[] | null;
  footer_text: string | null;
  updated_at: string;
};

export type ProfileStat = {
  id: string;
  value: number;
  suffix: string | null;
  label: string;
  sort_order: number;
};

export type NavLink = {
  id: string;
  name: string;
  hash: string;
  sort_order: number;
};

export type Company = {
  id: string;
  name: string;
  logo_url: string;
  sort_order: number;
};

export type Experience = {
  id: string;
  title: string;
  company: string;
  description: string;
  icon: string;
  start_date: string;
  end_date: string | null;
  display_date: string;
  company_logo_url: string | null;
  sort_order: number;
};

export type Education = {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  display_date: string;
  institution_logo_url: string | null;
  sort_order: number;
};

export type ProjectCategory = {
  id: string;
  name: string;
  sort_order: number;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_url: string | null;
  demo_video_url: string | null;
  source_code_url: string | null;
  live_site_url: string | null;
  category_id: string | null;
  sort_order: number;
};

export type SkillGroup = {
  id: string;
  category: string;
  sort_order: number;
};

export type Skill = {
  id: string;
  name: string;
  group_id: string | null;
  sort_order: number;
};

export type VisitorProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  provider: string | null;
  company: string | null;
  role: string | null;
  created_at: string;
};

export type ResumeDownload = {
  id: string;
  visitor_id: string | null;
  downloaded_at: string;
};

// ---------- Insert types (fields with SQL DEFAULT are optional) ----------

export type ProfileInsert = {
  id?: string;
  singleton?: boolean;
  full_name: string;
  short_name: string;
  job_title: string;
  tagline?: string | null;
  typewriter_titles: string[];
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  resume_url?: string | null;
  website_url?: string | null;
  about_tech_stack?: string | null;
  about_current_focus?: string | null;
  about_beyond_code?: string | null;
  about_expertise?: string[] | null;
  footer_text?: string | null;
  updated_at?: string;
};

export type ProfileStatInsert = {
  id?: string;
  value: number;
  suffix?: string | null;
  label: string;
  sort_order?: number;
};

export type NavLinkInsert = {
  id?: string;
  name: string;
  hash: string;
  sort_order?: number;
};

export type CompanyInsert = {
  id?: string;
  name: string;
  logo_url: string;
  sort_order?: number;
};

export type ExperienceInsert = {
  id?: string;
  title: string;
  company: string;
  description: string;
  icon?: string;
  start_date: string;
  end_date?: string | null;
  display_date: string;
  company_logo_url?: string | null;
  sort_order?: number;
};

export type EducationInsert = {
  id?: string;
  institution: string;
  degree: string;
  field_of_study?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  display_date?: string;
  institution_logo_url?: string | null;
  sort_order?: number;
};

export type ProjectCategoryInsert = {
  id?: string;
  name: string;
  sort_order?: number;
};

export type ProjectInsert = {
  id?: string;
  title: string;
  description: string;
  tags: string[];
  image_url?: string | null;
  demo_video_url?: string | null;
  source_code_url?: string | null;
  live_site_url?: string | null;
  category_id?: string | null;
  sort_order?: number;
};

export type SkillGroupInsert = {
  id?: string;
  category: string;
  sort_order?: number;
};

export type SkillInsert = {
  id?: string;
  name: string;
  group_id?: string | null;
  sort_order?: number;
};

export type VisitorProfileInsert = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  provider?: string | null;
  company?: string | null;
  role?: string | null;
  created_at?: string;
};

export type ResumeDownloadInsert = {
  id?: string;
  visitor_id?: string | null;
  downloaded_at?: string;
};

// ---------- Resume Builder Row types ----------

export type ResumeTemplate = {
  id: string;
  registry_key: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_builtin: boolean;
  page_size: string;
  columns: number;
  style_config: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ResumeConfig = {
  id: string;
  name: string;
  description: string | null;
  template_id: string | null;
  sections: ResumeSectionConfig[];
  style_overrides: Record<string, unknown>;
  custom_summary: string | null;
  job_description: string | null;
  jd_keywords: string[] | null;
  jd_coverage_score: number | null;
  jd_analysis: JdAnalysisResult | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ResumeVersion = {
  id: string;
  config_id: string;
  template_id: string | null;
  config_snapshot: Record<string, unknown>;
  pdf_storage_path: string;
  pdf_file_size: number | null;
  page_count: number | null;
  generation_time_ms: number | null;
  is_active: boolean;
  created_at: string;
};

// ---------- Resume Builder supporting types ----------

export type ResumeSectionConfig = {
  section: 'summary' | 'experience' | 'education' | 'projects' | 'skills' | 'custom';
  enabled: boolean;
  label: string;
  itemIds: string[] | null;
  sort_order: number;
};

export type JdAnalysisResult = {
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: JdSuggestion[];
};

export type JdSuggestion = {
  type: 'include_experience' | 'include_project' | 'include_skill_group' | 'emphasize';
  itemId: string;
  reason: string;
};

// ---------- Resume Builder Insert types ----------

export type ResumeTemplateInsert = {
  id?: string;
  registry_key: string;
  name: string;
  description?: string | null;
  thumbnail_url?: string | null;
  is_builtin?: boolean;
  page_size?: string;
  columns?: number;
  style_config?: Record<string, unknown>;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type ResumeConfigInsert = {
  id?: string;
  name: string;
  description?: string | null;
  template_id?: string | null;
  sections?: ResumeSectionConfig[];
  style_overrides?: Record<string, unknown>;
  custom_summary?: string | null;
  job_description?: string | null;
  jd_keywords?: string[] | null;
  jd_coverage_score?: number | null;
  jd_analysis?: JdAnalysisResult | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ResumeVersionInsert = {
  id?: string;
  config_id: string;
  template_id?: string | null;
  config_snapshot: Record<string, unknown>;
  pdf_storage_path: string;
  pdf_file_size?: number | null;
  page_count?: number | null;
  generation_time_ms?: number | null;
  is_active?: boolean;
  created_at?: string;
};

// ---------- Convenience types for frontend ----------

// Skill group with nested skills (used in the skills section)
export type SkillGroupWithSkills = SkillGroup & {
  skills: Skill[];
};

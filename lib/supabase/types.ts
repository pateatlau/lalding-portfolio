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

// ---------- Convenience types for frontend ----------

// Skill group with nested skills (used in the skills section)
export type SkillGroupWithSkills = SkillGroup & {
  skills: Skill[];
};

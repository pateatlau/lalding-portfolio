// Standardized data shape passed to every resume template component.
// Built from CMS data (profile, experiences, projects, skills) + config overrides.

export type ResumeData = {
  profile: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string | null;
    location: string | null;
    websiteUrl: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
  };
  summary: string | null;
  sections: ResumeSection[];
  style: ResumeStyle;
  pageSize: 'A4' | 'Letter';
};

export type ResumeSection = {
  type: 'experience' | 'projects' | 'skills' | 'education' | 'custom';
  label: string;
  items: ExperienceItem[] | ProjectItem[] | SkillGroupItem[] | CustomItem[];
};

export type ExperienceItem = {
  title: string;
  company: string;
  displayDate: string;
  description: string;
};

export type ProjectItem = {
  title: string;
  description: string;
  tags: string[];
  sourceCodeUrl: string | null;
  liveSiteUrl: string | null;
};

export type SkillGroupItem = {
  category: string;
  skills: string[];
};

export type CustomItem = {
  content: string;
};

export type ResumeStyle = {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  headingFontFamily: string;
  fontSize: string;
  lineHeight: string;
  margins: { top: string; right: string; bottom: string; left: string };
};

// Every template component must satisfy this interface
export type ResumeTemplateComponent = React.FC<{ data: ResumeData }>;

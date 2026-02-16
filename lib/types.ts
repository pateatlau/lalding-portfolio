import { links } from './data';

export type SectionName = (typeof links)[number]['name'];

// Serializable data types passed from server component (page.tsx) to client components.
// These use camelCase (frontend convention) and are decoupled from the DB column names.

export type ProfileData = {
  fullName: string;
  shortName: string;
  jobTitle: string;
  tagline: string;
  typewriterTitles: string[];
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  resumeUrl: string;
  aboutTechStack: string;
  aboutCurrentFocus: string;
  aboutBeyondCode: string;
  aboutExpertise: string[];
  footerText: string;
};

export type ProfileStatData = {
  value: number;
  suffix: string;
  label: string;
};

export type CompanyData = {
  name: string;
  logo: string;
};

export type ExperienceData = {
  title: string;
  company: string;
  description: string;
  icon: string;
  date: string;
  companyLogo: string;
};

export type ProjectData = {
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  demoVideoUrl: string | null;
  sourceCode: string;
  liveSite: string;
  category: string;
};

export type SkillGroupData = {
  category: string;
  skills: string[];
};

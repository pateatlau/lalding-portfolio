/**
 * Seed script — migrates lib/data.ts + hardcoded component content into Supabase.
 *
 * Usage: npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Uses the admin client (service role key) to bypass RLS.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ---------------------------------------------------------------------------
// Load env vars from .env.local (Node.js doesn't read them automatically)
// ---------------------------------------------------------------------------
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local may not exist — that's fine if env vars are set externally
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

// ---------------------------------------------------------------------------
// Date parsing (per plan doc Section 1.5)
// ---------------------------------------------------------------------------
const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function parseDateRange(dateStr: string): {
  start_date: string;
  end_date: string | null;
  display_date: string;
} {
  const display_date = dateStr;
  const parts = dateStr.split(' - ');

  if (parts.length === 2) {
    const start = parseDate(parts[0].trim());
    const endRaw = parts[1].trim();

    // "Present", "Current", "Now" → null end_date
    if (/^(present|current|now)$/i.test(endRaw)) {
      return { start_date: start, end_date: null, display_date };
    }

    const end = parseDate(endRaw);
    return { start_date: start, end_date: end, display_date };
  }

  // Year-only (e.g. "2025")
  if (/^\d{4}$/.test(dateStr.trim())) {
    return {
      start_date: `${dateStr.trim()}-01-01`,
      end_date: null,
      display_date,
    };
  }

  // Unparseable — warn and use fallback
  console.warn(
    `⚠️  Unparseable date "${dateStr}" — using today as start_date, NULL as end_date. Please review manually.`
  );
  return {
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    display_date,
  };
}

function parseDate(s: string): string {
  // "Month Year" → "YYYY-MM-01"
  const monthYear = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase().slice(0, 3)];
    if (month) {
      return `${monthYear[2]}-${String(month).padStart(2, '0')}-01`;
    }
  }

  // Year-only → "YYYY-01-01"
  if (/^\d{4}$/.test(s.trim())) {
    return `${s.trim()}-01-01`;
  }

  // Fallback
  console.warn(`⚠️  Could not parse date part "${s}" — using today. Please review manually.`);
  return new Date().toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Seed data (from lib/data.ts + hardcoded component content)
// ---------------------------------------------------------------------------

async function seed() {
  console.log('🌱 Seeding database...\n');

  // 1. Profile (singleton)
  console.log('  → profile');
  const { error: profileError } = await supabase.from('profile').upsert(
    {
      singleton: true,
      full_name: 'Laldingliana Tlau Vantawl',
      short_name: 'Lalding',
      job_title: 'Full-stack Tech Lead',
      tagline:
        'Building scalable web applications with expertise in React, Next.js, TypeScript, and modern web technologies.',
      typewriter_titles: [
        'Full-stack Tech Lead',
        'React Specialist',
        '15+ Years Experience',
        'Cross-platform Developer',
      ],
      email: 'laldingliana.tv@gmail.com',
      phone: '+91 9972228955',
      location: 'Bangalore, India',
      linkedin_url: 'https://www.linkedin.com/in/laldingliana-tv/',
      github_url: 'https://github.com/pateatlau',
      resume_url: null, // will be set when resume is uploaded to Supabase Storage
      about_tech_stack:
        'My core stack is the React Ecosystem and Node.js. Experienced in full-stack development with Next.js and MERN stack, with additional expertise in monorepos, micro frontends, and cross-platform development across web, iOS, and Android.',
      about_current_focus:
        'Looking for a Technical Lead or Architect role. Currently deepening expertise in AI tech stack.',
      about_beyond_code:
        "When I'm not working, I enjoy playing chess, reading books, and contributing to society. I love learning new things and continuously improving my tech stack.",
      about_expertise: [
        'Monorepos & NX',
        'Micro Frontends',
        'Module Federation',
        'Cross-platform (RN + Web)',
      ],
      footer_text:
        'About this website: built with React & Next.js (App Router & Server Actions), TypeScript, Tailwind CSS, Framer Motion, React Email & Resend, Vercel hosting.',
    },
    { onConflict: 'singleton' }
  );
  if (profileError) throw profileError;

  // 2. Profile stats
  console.log('  → profile_stats');
  const stats = [
    { value: 15, suffix: '+', label: 'Years Experience', sort_order: 0 },
    { value: 50, suffix: '+', label: 'Projects Delivered', sort_order: 1 },
    { value: 8, suffix: '+', label: 'Companies', sort_order: 2 },
    { value: 10, suffix: '+', label: 'Teams Led', sort_order: 3 },
  ];
  const { error: statsError } = await supabase
    .from('profile_stats')
    .upsert(stats, { onConflict: 'id', ignoreDuplicates: false });
  if (statsError) throw statsError;

  // 3. Nav links
  console.log('  → nav_links');
  const navLinks = [
    { name: 'Home', hash: '#home', sort_order: 0 },
    { name: 'About', hash: '#about', sort_order: 1 },
    { name: 'Projects', hash: '#projects', sort_order: 2 },
    { name: 'Skills', hash: '#skills', sort_order: 3 },
    { name: 'Experience', hash: '#experience', sort_order: 4 },
    { name: 'Contact', hash: '#contact', sort_order: 5 },
  ];
  const { error: navError } = await supabase.from('nav_links').upsert(navLinks, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });
  if (navError) throw navError;

  // 4. Companies
  console.log('  → companies');
  const companies = [
    { name: 'HDFC Bank Limited', logo_url: '/hdfc.webp', sort_order: 0 },
    { name: 'Morgan Stanley', logo_url: '/morgan-stanley.webp', sort_order: 1 },
    {
      name: 'Wissen Technology | Morgan Stanley',
      logo_url: '/wissen.webp',
      sort_order: 2,
    },
    { name: 'Ingenio', logo_url: '/ingenio.webp', sort_order: 3 },
    { name: 'Kongsberg Digital', logo_url: '/kongsberg.webp', sort_order: 4 },
    { name: 'Davinta Technologies', logo_url: '/davinta.webp', sort_order: 5 },
    {
      name: 'Collective India Pvt. Ltd.',
      logo_url: '/collective.webp',
      sort_order: 6,
    },
    { name: 'Kaseya Software', logo_url: '/kaseya.webp', sort_order: 7 },
    { name: 'Yahoo!', logo_url: '/yahoo.webp', sort_order: 8 },
    {
      name: 'HCL Technologies | Yahoo!',
      logo_url: '/hcl.webp',
      sort_order: 9,
    },
  ];
  const { error: companiesError } = await supabase
    .from('companies')
    .upsert(companies, { onConflict: 'id', ignoreDuplicates: false });
  if (companiesError) throw companiesError;

  // 5. Experiences (with date parsing and icon mapping)
  console.log('  → experiences');
  // Icon mapping: React element type name → string identifier
  const experiencesSeedData = [
    {
      title: 'Deputy Vice President',
      company: 'HDFC Bank Limited',
      description:
        'My main role is to lead the front-end team and work with other teams like design, backend, product, and devops teams to deliver the project. My other roles include delivering innovative solutions, leading the development of new features, and collaborating with cross-functional teams to achieve project goals.',
      icon: 'work',
      dateStr: 'May 2023 - 2025',
      company_logo_url: '/hdfc.webp',
      sort_order: 0,
    },
    {
      title: 'Senior Principal Engineer',
      company: 'Wissen Technology | Morgan Stanley',
      description:
        'I got deployed onsite from Wissen Technology to Morgan Stanley as a Senior Principal Engineer. I delivered the design and development of various products at Morgan Stanley.',
      icon: 'react',
      dateStr: 'Jul 2020 - Apr 2023',
      company_logo_url: '/wissen.webp',
      sort_order: 1,
    },
    {
      title: 'Senior Software Engineer',
      company: 'Ingenio',
      description:
        "Key contributor to the company's setup in India. Setting up projects, leading the Frontend team, and leading the development of new features.",
      icon: 'work',
      dateStr: 'Oct 2019 - Feb 2020',
      company_logo_url: '/ingenio.webp',
      sort_order: 2,
    },
    {
      title: 'Technical Advisor',
      company: 'Kongsberg Digital',
      description:
        "Active role of technical advisor in the company's digital journey. I was responsible for delivering migration of legacy project in Angular to React.",
      icon: 'react',
      dateStr: 'Apr 2019 - Sep 2019',
      company_logo_url: '/kongsberg.webp',
      sort_order: 3,
    },
    {
      title: 'Staff Software Engineer',
      company: 'Davinta Technologies',
      description:
        "Led the Frontend team in developing the company's corporate website and flagship product. Also delivered various POC's for various products using React, Angular and Docker.",
      icon: 'work',
      dateStr: 'Jul 2017 - Apr 2019',
      company_logo_url: '/davinta.webp',
      sort_order: 4,
    },
    {
      title: 'Senior Software Engineer',
      company: 'Collective India Pvt. Ltd.',
      description:
        "Co-led the Frontend team in developing the company's flagship product. Led the effort to modernise the project with automated build tools, linting, and testing.",
      icon: 'react',
      dateStr: 'Dec 2015 - Jun 2017',
      company_logo_url: '/collective.webp',
      sort_order: 5,
    },
    {
      title: 'Member of Technical Staff',
      company: 'Kaseya Software',
      description:
        'Led Frontend team in Corporate Website Migration to Drupal and Complete Re-design of the website. Also worked closely with the VSA engineering team and UX team to deliver the reskinning of the Flagship product.',
      icon: 'work',
      dateStr: 'Jul 2014 - Dec 2015',
      company_logo_url: '/kaseya.webp',
      sort_order: 6,
    },
    {
      title: 'Senior Tech Lead',
      company: 'HCL Technologies | Yahoo!',
      description:
        'I got deployed onsite from HCL Technologies to Yahoo! as Senior Tech Lead. Led the Frontend team from HCL Technologies. Key contributor in reskinning of various Yahoo! websites. Developed widgets for Yahoo! Homes.',
      icon: 'react',
      dateStr: 'Sep 2011 - Jul 2014',
      company_logo_url: '/hcl.webp',
      sort_order: 7,
    },
    {
      title: 'PHP Developer',
      company: 'SparkLogics',
      description:
        'Developed and maintained various websites using PHP, Drupal, MySQL and Frontend technologies.',
      icon: 'work',
      dateStr: 'Jun 2009 - Aug 2011',
      company_logo_url: '/exp1.svg',
      sort_order: 8,
    },
  ];

  const experiences = experiencesSeedData.map(({ dateStr, ...rest }) => {
    const { start_date, end_date, display_date } = parseDateRange(dateStr);
    return { ...rest, start_date, end_date, display_date };
  });

  const { error: expError } = await supabase
    .from('experiences')
    .upsert(experiences, { onConflict: 'id', ignoreDuplicates: false });
  if (expError) throw expError;

  // 6. Project categories
  console.log('  → project_categories');
  const categories = [
    { name: 'All', sort_order: 0 },
    { name: 'React', sort_order: 1 },
    { name: 'Mobile', sort_order: 2 },
    { name: 'Full-stack', sort_order: 3 },
  ];
  const { data: insertedCategories, error: catError } = await supabase
    .from('project_categories')
    .upsert(categories, { onConflict: 'name' })
    .select();
  if (catError) throw catError;

  // Build lookup: category name → id
  const categoryMap = new Map<string, string>();
  for (const cat of insertedCategories ?? []) {
    categoryMap.set(cat.name, cat.id);
  }

  // 7. Projects
  console.log('  → projects');
  const projectsSeedData = [
    {
      title: 'Movies App',
      description:
        'Multiplatform app running in web, iOS and Android. It fetches movies from TMDB API, displays movie details, and search for movies.',
      tags: ['React Native', 'Expo', 'RNW', 'Nativewind', 'Typescript'],
      image_url: null as string | null, // images will be migrated to Supabase Storage later
      demo_video_url: null as string | null,
      source_code_url: 'https://github.com/pateatlau/movies-expo',
      live_site_url: 'https://movies.lalding.in/',
      category_name: 'Mobile',
      sort_order: 0,
    },
    {
      title: 'Micro Frontend App',
      description:
        'Micro frontend app using React and Vite Module Federation plugin. It has a host app and a remote app.',
      tags: ['React', 'Module Federation', 'Vite'],
      image_url: null,
      demo_video_url: null,
      source_code_url: 'https://github.com/pateatlau/vite-mfe-host',
      live_site_url: 'https://mfe-oflom8uum-lalding.vercel.app/',
      category_name: 'React',
      sort_order: 1,
    },
    {
      title: 'Weather App',
      description:
        'Dynamic web app for weather forecast. It has features like search, weather history, and weather forecast.',
      tags: ['React', 'Typescript', 'Tailwind', 'Vite', 'React Query', 'Recharts'],
      image_url: null,
      demo_video_url: null,
      source_code_url: 'https://github.com/pateatlau/weather-app',
      live_site_url: 'https://weather.lalding.in/',
      category_name: 'React',
      sort_order: 2,
    },
    {
      title: 'eCommerce App',
      description:
        'Fullstack MERN app for products. It has full CRUD opertions using REST API developed in Express and MongoDB.',
      tags: ['React', 'Nodejs', 'Express', 'MongoDB', 'Chakra UI'],
      image_url: null,
      demo_video_url: null,
      source_code_url: 'https://github.com/pateatlau/mern-products-app',
      live_site_url: 'https://lalding-products.onrender.com/',
      category_name: 'Full-stack',
      sort_order: 3,
    },
  ];

  const projects = projectsSeedData.map(({ category_name, ...rest }) => ({
    ...rest,
    category_id: categoryMap.get(category_name) ?? null,
  }));

  const { error: projError } = await supabase
    .from('projects')
    .upsert(projects, { onConflict: 'id', ignoreDuplicates: false });
  if (projError) throw projError;

  // 8. Skill groups + skills
  console.log('  → skill_groups + skills');
  const skillGroupsSeedData = [
    {
      category: 'Leadership & Architecture',
      sort_order: 0,
      skills: [
        'Technology Leadership',
        'Fullstack Development',
        'Cross-Platform Development',
        'Micro Frontend',
        'Module Federation',
        'Monorepos',
        'Microservices',
      ],
    },
    {
      category: 'Frontend',
      sort_order: 1,
      skills: [
        'React',
        'Next.js',
        'TypeScript',
        'JavaScript',
        'HTML',
        'CSS',
        'Redux Toolkit',
        'Zustand',
        'Tanstack Query',
        'Framer Motion',
      ],
    },
    {
      category: 'Mobile',
      sort_order: 2,
      skills: ['React Native', 'Expo', 'React Native Web'],
    },
    {
      category: 'Backend & Database',
      sort_order: 3,
      skills: [
        'Node.js',
        'Express',
        'GraphQL',
        'MongoDB',
        'Mongoose',
        'PostgreSQL',
        'Prisma',
        'Python',
      ],
    },
    {
      category: 'UI Libraries',
      sort_order: 4,
      skills: ['Tailwind CSS', 'Shadcn UI', 'Material UI', 'Bootstrap'],
    },
    {
      category: 'Tools & DevOps',
      sort_order: 5,
      skills: [
        'Git',
        'Github',
        'Docker',
        'Kubernetes',
        'Amazon Web Services (AWS)',
        'NX',
        'Webpack',
        'Vite',
        'Rollup',
        'npm',
      ],
    },
    {
      category: 'Testing',
      sort_order: 6,
      skills: ['Jest', 'vitest', 'React Testing Library'],
    },
    {
      category: 'Auth & Security',
      sort_order: 7,
      skills: ['JWT', 'OAuth', 'Auth0'],
    },
  ];

  for (const group of skillGroupsSeedData) {
    const { data: insertedGroup, error: groupError } = await supabase
      .from('skill_groups')
      .upsert(
        { category: group.category, sort_order: group.sort_order },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();
    if (groupError) throw groupError;

    const skillRows = group.skills.map((name, i) => ({
      name,
      group_id: insertedGroup.id,
      sort_order: i,
    }));

    const { error: skillsError } = await supabase
      .from('skills')
      .upsert(skillRows, { onConflict: 'id', ignoreDuplicates: false });
    if (skillsError) throw skillsError;
  }

  console.log('\n✅ Seed complete!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

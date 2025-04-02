import React from 'react';
import { CgWorkAlt } from 'react-icons/cg';
import { FaReact } from 'react-icons/fa';
// import { LuGraduationCap } from 'react-icons/lu';
import corpcommentImg from '@/public/corpcomment.png';
import rmtdevImg from '@/public/rmtdev.png';
import weatherImg from '@/public/weather.png';
import moviesImg from '@/public/movies.png';

export const links = [
  {
    name: 'Home',
    hash: '#home',
  },
  {
    name: 'About',
    hash: '#about',
  },
  {
    name: 'Projects',
    hash: '#projects',
  },
  {
    name: 'Skills',
    hash: '#skills',
  },
  {
    name: 'Experience',
    hash: '#experience',
  },
  {
    name: 'Contact',
    hash: '#contact',
  },
] as const;

export const companiesSliderData = [
  {
    name: 'HDFC Bank Limited',
    logo: '/hdfc.webp',
  },
  {
    name: 'Morgan Stanley',
    logo: '/morgan-stanley.webp',
  },
  {
    name: 'Wissen Technology | Morgan Stanley',
    logo: '/wissen.webp',
  },
  {
    name: 'Ingenio',
    logo: '/ingenio.webp',
  },
  {
    name: 'Kongsberg Digital',
    logo: '/kongsberg.webp',
  },
  {
    name: 'Davinta Technologies',
    logo: '/davinta.webp',
  },
  {
    name: 'Collective India Pvt. Ltd.',
    logo: '/collective.webp',
  },
  {
    name: 'Kaseya Software',
    logo: '/kaseya.webp',
  },
  {
    name: 'Yahoo!',
    logo: '/yahoo.webp',
  },
  {
    name: 'HCL Technologies | Yahoo!',
    logo: '/hcl.webp',
  },
] as const;

export const experiencesData = [
  {
    title: 'Deputy Vice President',
    location: 'HDFC Bank Limited',
    description:
      'My main role is to lead the front-end team and work with other teams like design, backend, product, and devops teams to deliver the project. My other roles include delivering innovative solutions, leading the development of new features, and collaborating with cross-functional teams to achieve project goals.',
    icon: React.createElement(CgWorkAlt),
    date: 'May 2023 - 2025',
    companylogo: '/hdfc.webp',
  },
  {
    title: 'Senior Principal Engineer',
    location: 'Wissen Technology | Morgan Stanley',
    description:
      'I got deployed onsite from Wissen Technology to Morgan Stanley as a Senior Principal Engineer. I delivered the design and development of various products at Morgan Stanley.',
    icon: React.createElement(FaReact),
    date: 'Jul 2020 - Apr 2023',
    companylogo: '/wissen.webp',
  },
  {
    title: 'Senior Software Engineer',
    location: 'Ingenio',
    description:
      "Key contributor to the company's setup in India. Setting up projects, leading the Frontend team, and leading the development of new features.",
    icon: React.createElement(CgWorkAlt),
    date: 'Oct 2019 - Feb 2020',
    companylogo: '/ingenio.webp',
  },
  {
    title: 'Technical Advisor',
    location: 'Kongsberg Digital',
    description:
      "Active role of technical advisor in the company's digital journey. I was responsible for delivering migration of legacy project in Angular to React.",
    icon: React.createElement(FaReact),
    date: 'Apr 2019 - Sep 2019',
    companylogo: '/kongsberg.webp',
  },
  {
    title: 'Staff Software Engineer',
    location: 'Davinta Technologies',
    description:
      "Led the Frontend team in developing the company's corporate website and flagship product. Also delivered various POC's for various products using React, Angular and Docker.",
    icon: React.createElement(CgWorkAlt),
    date: 'Jul 2017 - Apr 2019',
    companylogo: '/davinta.webp',
  },
  {
    title: 'Senior Software Engineer',
    location: 'Collective India Pvt. Ltd.',
    description:
      "Co-led the Frontend team in developing the company's flagship product. Led the effort to modernise the project with automated build tools, linting, and testing.",
    icon: React.createElement(FaReact),
    date: 'Dec 2015 - Jun 2017',
    companylogo: '/collective.webp',
  },
  {
    title: 'Member of Technical Staff',
    location: 'Kaseya Software',
    description:
      'Led Frontend team in Corporate Website Migration to Drupal and Complete Re-design of the website. Also worked closely with the VSA engineering team and UX team to deliver the reskinning of the Flagship product.',
    icon: React.createElement(CgWorkAlt),
    date: 'Jul 2014 - Dec 2015',
    companylogo: '/kaseya.webp',
  },
  {
    title: 'Senior Tech Lead',
    location: 'HCL Technologies | Yahoo!',
    description:
      'I got deployed onsite from HCL Technologies to Yahoo! as Senior Tech Lead. Led the Frontend team from HCL Technologies. Key contributor in reskinning of various Yahoo! websites. Developed widgets for Yahoo! Homes.',
    icon: React.createElement(FaReact),
    date: 'Sep 2011 - Jul 2014',
    companylogo: '/hcl.webp',
  },
  {
    title: 'PHP Developer',
    location: 'SparkLogics',
    description:
      'Developed and maintained various websites using PHP, Drupal, MySQL and Frontend technologies.',
    icon: React.createElement(CgWorkAlt),
    date: 'Jun 2009 - Aug 2011',
    companylogo: '/exp1.svg',
  },
] as const;

export const projectsData = [
  {
    title: 'Movies App',
    description:
      'Multiplatform app running in web, iOS and Android. It fetches movies from TMDB API, displays movie details, and search for movies.',
    tags: ['React Native', 'Expo', 'RNW', 'Nativewind', 'Typescript'],
    imageUrl: moviesImg,
    sourceCode: 'https://github.com/pateatlau/movies-expo',
    liveSite: 'https://movies.lalding.in/',
  },
  {
    title: 'Micro Frontend App',
    description:
      'Micro frontend app using React and Vite Module Federation plugin. It has a host app and a remote app.',
    tags: ['React', 'Module Federation', 'Vite'],
    imageUrl: rmtdevImg,
    sourceCode: 'https://github.com/pateatlau/vite-mfe-host',
    liveSite: 'https://mfe-oflom8uum-lalding.vercel.app/',
  },
  {
    title: 'Weather App',
    description:
      'Dynamic web app for weather forecast. It has features like search, weather history, and weather forecast.',
    tags: [
      'React',
      'Typescript',
      'Tailwind',
      'Vite',
      'React Query',
      'Recharts',
    ],
    imageUrl: weatherImg,
    sourceCode: 'https://github.com/pateatlau/weather-app',
    liveSite: 'https://weather.lalding.in/',
  },
  {
    title: 'eCommerce App',
    description:
      'Fullstack MERN app for products. It has full CRUD opertions using REST API developed in Express and MongoDB.',
    tags: ['React', 'Nodejs', 'Express', 'MongoDB', 'Chakra UI'],
    imageUrl: rmtdevImg,
    sourceCode: 'https://github.com/pateatlau/mern-products-app',
    liveSite: 'https://lalding-products.onrender.com/',
  },
] as const;

export const skillsData = [
  'Technology Leadership',
  'Frontend Development',
  'Fullstack Development',
  'Cross-Platform Development',
  'Micro Frontend',
  'Module Federation',
  'Monorepos',
  'NX',
  'Webpack',
  'Vite',
  'Rollup',
  'Docker',
  'Git',
  'Github',
  'Amazon Web Services (AWS)',
  'npm',
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'React Native',
  'Expo',
  'React Native Web',
  'Redux Toolkit',
  'Zustand',
  'Tanstack Query',
  'GraphQL',
  'Kubernetes',
  'Jest',
  'vitest',
  'React Testing Library',
  'Material UI',
  'Bootstrap',
  'Tailwind CSS',
  'Shadcn UI',
  'Framer Motion',
  'MongoDB',
  'Mongoose',
  'PostgreSQL',
  'Prisma',
  'JWT',
  'OAuth',
  'Auth0',
  'Python',
  'Microservices',
  // 'Turborepo',
  // 'npm',
  // 'pnpm',
  // 'yarn',
  // 'Cypress',
  // 'Design System',
  // 'Storybook',
  // 'System Design',
] as const;

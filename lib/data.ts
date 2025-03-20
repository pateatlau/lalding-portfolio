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

export const experiencesData = [
  {
    title: 'Deputy Vice President',
    location: 'HDFC Bank Limited',
    description:
      'My main role is to lead the front-end team and work with the back-end team to deliver the project. I also work with various other teams like the design team, backend team, product team, and devops team.',
    icon: React.createElement(CgWorkAlt),
    date: 'May 2023 - 2025',
    companylogo: './hdfc.webp',
  },
  {
    title: 'Senior PrinciPal Engineer',
    location: 'Wissen Technology | Morgan Stanley',
    description:
      'I got deployed from Wissen Technology to Morgan Stanley as a Senior PrinciPal Engineer. I worked on the design and development of various products at Morgan Stanley.',
    icon: React.createElement(FaReact),
    date: 'Jul 2020 - Apr 2023',
    companylogo: './wissen.webp',
  },
  {
    title: 'Senior Software Engineer',
    location: 'Ingenio',
    description:
      "Key contributor to the company's setup in India. Setting up projects, leading the Frontend team, and leading the development of new features.",
    icon: React.createElement(CgWorkAlt),
    date: 'Oct 2019 - Feb 2020',
    companylogo: './ingenio.webp',
  },
  {
    title: 'Technical Advisor',
    location: 'Kongsberg Digital',
    description:
      "Active role of technical advisor in the company's digital journey. I was responsible for delivering migration of legacy project in Angular to React.",
    icon: React.createElement(FaReact),
    date: 'Apr 2019 - Sep 2019',
    companylogo: './kongsberg.webp',
  },
  {
    title: 'Staff Software Engineer',
    location: 'Davinta Technologies',
    description:
      "Led the Frontend team in developing the company's corporate website and flagship product. Also delivered various POC's for various products using React, Angular and Docker.",
    icon: React.createElement(CgWorkAlt),
    date: 'Jul 2017 - Apr 2019',
    companylogo: './davinta.webp',
  },
  {
    title: 'Senior Software Engineer',
    location: 'Collective India Pvt. Ltd.',
    description:
      "Co-led the Frontend team in developing the company's flagship product. Led the effort to modernise the project with automated build tools, linting, and testing.",
    icon: React.createElement(FaReact),
    date: 'Dec 2015 - Jun 2017',
    companylogo: './collective.webp',
  },
  {
    title: 'Member of Technical Staff',
    location: 'Kaseya Software',
    description:
      'Led Frontend team in Corporate Website Migration to Drupal and Complete Re-design of the website. Also worked closely with the VSA engineering team and UX team to deliver the reskinning of the Flagship product.',
    icon: React.createElement(CgWorkAlt),
    date: 'Jul 2014 - Dec 2015',
    companylogo: './kaseya.webp',
  },
  {
    title: 'Senior Tech Lead',
    location: 'HCL Technologies',
    description:
      'Got deployed onsite at Yahoo! as Senior Tech Lead. Led the Frontend team from HCL Technologies. Key contributor in reskinning of various Yahoo! websites. Developed widgets for Yahoo! Homes.',
    icon: React.createElement(FaReact),
    date: 'Sep 2011 - Jul 2014',
    companylogo: './hcl.webp',
  },
  {
    title: 'PHP Developer',
    location: 'SparkLogics',
    description:
      'Developed and maintained various websites using PHP, Drupal, MySQL and Frontend technologies.',
    icon: React.createElement(CgWorkAlt),
    date: 'Jun 2009 - Aug 2011',
    companylogo: './exp1.svg',
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
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'React Native',
  'React Native Web',
  'Git',
  'Tailwind CSS',
  'Shadcn UI',
  'AWS',
  'Vite',
  'Material UI',
  'Bootstrap',
  'Prisma',
  'MongoDB',
  'Redux Toolkit',
  'Zustand',
  'Tanstack Query',
  'Micro Frontend',
  'Module Federation',
  'Webpack',
  'NX',
  'Monorepo',
  'Docker',
  'npm',
  'pnpm',
  'yarn',
  'GraphQL',
  'Apollo',
  'Express',
  'PostgreSQL',
  'Python',
  'Django',
  'Kubernetes',
  'Framer Motion',
  'Jest',
  'React Testing Library',
  'Cypress',
  'Storybook',
] as const;

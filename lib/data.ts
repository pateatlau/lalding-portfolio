import React from 'react';
import { CgWorkAlt } from 'react-icons/cg';
import { FaReact } from 'react-icons/fa';
// import { LuGraduationCap } from 'react-icons/lu';
import corpcommentImg from '@/public/corpcomment.png';
import rmtdevImg from '@/public/rmtdev.png';
import wordanalyticsImg from '@/public/wordanalytics.png';

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
      "Active role of technical advisor in the company's digital transformation. I was responsible for the technical architecture of the company's products.",
    icon: React.createElement(CgWorkAlt),
    date: 'Oct 2019 - Feb 2020',
    companylogo: './ingenio.webp',
  },
  {
    title: 'Technical Advisor',
    location: 'Kongsberg Digital',
    description:
      "Active role of technical advisor in the company's digital transformation. I was responsible for the technical architecture of the company's products.",
    icon: React.createElement(FaReact),
    date: 'Apr 2019 - Sep 2019',
    companylogo: './kongsberg.webp',
  },
  {
    title: 'Staff Software Engineer',
    location: 'Davinta Technologies',
    description:
      "Active role of technical advisor in the company's digital transformation. I was responsible for the technical architecture of the company's products.",
    icon: React.createElement(CgWorkAlt),
    date: 'Jul 2017 - Apr 2019',
    companylogo: './davinta.webp',
  },
  {
    title: 'Senior Software Engineer',
    location: 'Collective India Pvt. Ltd.',
    description:
      "Active role of technical advisor in the company's digital transformation. I was responsible for the technical architecture of the company's products.",
    icon: React.createElement(FaReact),
    date: 'Dec 2015 - Jun 2017',
    companylogo: './collective.webp',
  },
  {
    title: 'Member of Technical Staff',
    location: 'Kaseya Software',
    description:
      "Active role of technical advisor in the company's digital transformation. I was responsible for the technical architecture of the company's products.",
    icon: React.createElement(CgWorkAlt),
    date: 'Jul 2014 - Dec 2015',
    companylogo: './kaseya.webp',
  },
  {
    title: 'Senior Tech Lead',
    location: 'HCL Technologies',
    description:
      "Active role of technical advisor in the company's digital transformation. I was responsible for the technical architecture of the company's products.",
    icon: React.createElement(FaReact),
    date: 'Sep 2011 - Jul 2014',
    companylogo: './hcl.webp',
  },
  {
    title: 'PHP Developer',
    location: 'SparkLogics',
    description:
      "Active role of technical advisor in the company's digital transformation. I was responsible for the technical architecture of the company's products.",
    icon: React.createElement(CgWorkAlt),
    date: 'Jun 2009 - Aug 2011',
    companylogo: './exp1.svg',
  },
] as const;

export const projectsData = [
  {
    title: 'Weather App',
    description:
      'Fullstack dynamic web app for weather forecast. It has features like search, weather history, and weather forecast.',
    tags: ['React', 'Next.js', 'MongoDB', 'Tailwind CSS', 'Prisma'],
    imageUrl: corpcommentImg,
    sourceCode: 'https://github.com/pateatlau/weather-app',
    liveSite: 'https://weather.lalding.in/',
  },
  {
    title: 'Fullstack MERN App',
    description:
      'Fullstack MERN app for products. It has full CRUD opertions using REST API developed in Express and MongoDB.',
    tags: ['React', 'Nodejs', 'Express', 'MongoDB', 'Chakra UI'],
    imageUrl: rmtdevImg,
    sourceCode: 'https://github.com/pateatlau/mern-products-app',
    liveSite: 'https://lalding-products.onrender.com/',
  },
  {
    title: 'Micro Frontend App',
    description:
      'Micro frontend app using React and Vite Module Federation plugin. It has a host app and a remote app, that is consumed by the host app.',
    tags: ['React', 'Module Federation', 'Vite'],
    imageUrl: rmtdevImg,
    sourceCode: 'https://github.com/pateatlau/vite-mfe-host',
    liveSite: 'https://mfe-oflom8uum-lalding.vercel.app/',
  },
  {
    title: 'Multiplatform App',
    description:
      'Multiplatform app using React Native and RNW. It has features like multiplatform support, authentication, and authorization.',
    tags: ['React Native', 'Expo', 'RNW', 'Tailwind', 'Shadcn UI'],
    imageUrl: rmtdevImg,
    sourceCode: 'https://github.com/pateatlau/movies-expo',
    liveSite: 'https://lalding.in/',
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

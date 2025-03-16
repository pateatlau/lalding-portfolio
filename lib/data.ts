import React from 'react';
import { CgWorkAlt } from 'react-icons/cg';
import { FaReact } from 'react-icons/fa';
import { LuGraduationCap } from 'react-icons/lu';
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
    icon: React.createElement(LuGraduationCap),
    date: '2023 - present',
    companylogo: './hdfc.webp',
  },
  {
    title: 'Senior PrinciPal Engineer',
    location: 'Wissen Technology | Morgan Stanley',
    description:
      'I got deployed from Wissen Technology to Morgan Stanley as a Senior PrinciPal Engineer. I worked on the design and development of various products at Morgan Stanley.',
    icon: React.createElement(CgWorkAlt),
    date: '2020 - 2023',
    companylogo: './wissen.webp',
  },
  {
    title: 'Technical Advisor',
    location: 'Kongsberg Digital',
    description:
      "Active role of technical advisor in the company's digital transformation. I was responsible for the technical architecture of the company's products.",
    icon: React.createElement(FaReact),
    date: '2019 - 2020',
    companylogo: './kongsberg.webp',
  },
] as const;

export const projectsData = [
  {
    title: 'Weather App',
    description:
      'Fullstack dynamic web app for weather forecast. It has features like search, weather history, and weather forecast.',
    tags: ['React', 'Next.js', 'MongoDB', 'Tailwind CSS', 'Prisma'],
    imageUrl: corpcommentImg,
  },
  {
    title: 'Fullstack CRUD App',
    description:
      'Fullstack CRUD app using React and Nodejs. It has features like CRUD operations, authentication, and authorization.',
    tags: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Redux'],
    imageUrl: rmtdevImg,
  },
  {
    title: 'Micro Frontend App',
    description:
      'Fullstack micro frontend app using React and Nodejs. It has features like micro frontend architecture, authentication, and authorization.',
    tags: ['React', 'Next.js', 'SQL', 'Tailwind', 'Framer'],
    imageUrl: wordanalyticsImg,
  },
  {
    title: 'Multiplatform App',
    description:
      'Multiplatform app using React Native and React Native Web. It has features like multiplatform support, authentication, and authorization.',
    tags: ['React', 'Next.js', 'SQL', 'Tailwind', 'Framer'],
    imageUrl: wordanalyticsImg,
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
  'Material UI',
  'Bootstrap',
  'Prisma',
  'MongoDB',
  'Redux Toolkit',
  'Zustand',
  'Tanstack Query',
  'Micro Frontend',
  'Monorepo',
  'Docker',
  'GraphQL',
  'Apollo',
  'Express',
  'PostgreSQL',
  'Python',
  'Django',
  'Framer Motion',
] as const;

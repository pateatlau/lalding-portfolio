'use client';

import React from 'react';
import SectionHeading from './section-heading';
import { motion } from 'framer-motion';
import { useSectionInView } from '@/lib/hooks';

export default function About() {
  const { ref } = useSectionInView('About');

  return (
    <motion.section
      ref={ref}
      className="mb-28 max-w-[45rem] scroll-mt-28 text-center leading-8 sm:mb-40"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
      id="about"
    >
      <SectionHeading>About me</SectionHeading>
      <p className="mb-3">
        My core <span className="font-medium">Tech Stack</span> is{' '}
        <span className="font-medium">React Ecosystem and Node.js</span>. Apart from Frontend
        skills, I am experienced in Fullstack development using{' '}
        <span className="font-medium">Nextjs</span> and{' '}
        <span className="font-medium">MERN stack</span>. I have additional skills in{' '}
        <span className="font-medium">Cutting Edge Techs</span> such as{' '}
        <span className="font-medium">Monorepos</span>,{' '}
        <span className="font-medium">Micro Frontends</span> and{' '}
        <span className="font-medium">Cross-platform development across web, iOS and Android</span>.
        I am currently looking for a <span className="font-medium">full-time position</span> as{' '}
        <span className="font-medium">Technical Lead or Architect</span>.
      </p>

      <p>
        <span className="italic">When I'm not working</span>, I enjoy playing chess, reading books,
        and helping others and contributing to society. I love{' '}
        <span className="font-medium">learning new things and improving my tech stack</span>, and am
        currently actively learning <span className="font-medium">AI tech stack.</span>
      </p>
    </motion.section>
  );
}

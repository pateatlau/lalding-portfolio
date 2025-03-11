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
      className="mb-28 max-w-[45rem] text-center leading-8 sm:mb-40 scroll-mt-28"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
      id="about"
    >
      <SectionHeading>About me</SectionHeading>
      <p className="mb-3">
        I have 15+ years of professional experience in
        <span className="font-medium">Web Development</span>.{' '}
        <span className="italic">My favorite part of programming</span> is the
        problem-solving aspect. I <span className="underline">love</span> the
        feeling of finally figuring out a solution to a problem. My core stack
        is <span className="font-medium">React Ecosystem and Node.js</span>. I
        am also familiar with mobile app develoment and cross-platform
        development. I am currently looking for a{' '}
        <span className="font-medium">full-time position</span> as a{' '}
        <span className="font-medium">
          Software Technical Lead or Architect
        </span>
        .
      </p>

      <p>
        <span className="italic">When I'm not coding</span>, I enjoy playing
        chess, reading books, and helping others and contributing to society. I
        also <span className="font-medium">learning new things</span>. I am
        currently transitioning{' '}
        <span className="font-medium">full architect role</span>. I'm also
        learning about AI tech stack.
      </p>
    </motion.section>
  );
}

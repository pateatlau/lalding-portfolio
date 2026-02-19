'use client';

import React from 'react';
import SectionHeading from './section-heading';
import { useSectionInView } from '@/lib/hooks';
import { motion } from 'framer-motion';
import type { SkillGroupData } from '@/lib/types';

const fadeInAnimationVariants = {
  initial: {
    opacity: 0,
    y: 100,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * index,
    },
  }),
};

export default function Skills({ skillGroups }: { skillGroups: SkillGroupData[] }) {
  const { ref } = useSectionInView('Skills');

  let globalIndex = 0;

  return (
    <section
      id="skills"
      ref={ref}
      className="mb-28 max-w-[53rem] scroll-mt-28 text-center sm:mb-40"
    >
      <SectionHeading>Skills &amp; Expertise</SectionHeading>

      <div className="space-y-8">
        {skillGroups.map((group) => (
          <div key={group.category}>
            <h3 className="text-accent-teal dark:text-accent-teal-light mb-3 text-sm font-semibold tracking-wide uppercase">
              {group.category}
            </h3>
            <ul className="flex flex-wrap justify-center gap-2 text-sm text-gray-800">
              {group.skills.map((skill) => {
                const index = globalIndex++;
                return (
                  <motion.li
                    className="borderBlack rounded-xl bg-white px-5 py-3 dark:bg-white/10 dark:text-white/80"
                    key={skill}
                    variants={fadeInAnimationVariants}
                    initial="initial"
                    whileInView="animate"
                    viewport={{
                      once: true,
                    }}
                    custom={index}
                  >
                    {skill}
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

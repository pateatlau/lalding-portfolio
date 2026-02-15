'use client';

import React, { useEffect, useRef, useState } from 'react';
import SectionHeading from './section-heading';
import { motion, useInView } from 'framer-motion';
import { useSectionInView } from '@/lib/hooks';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 1500;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

const stats = [
  { value: 15, suffix: '+', label: 'Years Experience' },
  { value: 50, suffix: '+', label: 'Projects Delivered' },
  { value: 8, suffix: '+', label: 'Companies' },
  { value: 10, suffix: '+', label: 'Teams Led' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function About() {
  const { ref } = useSectionInView('About');

  return (
    <motion.section
      ref={ref}
      className="mb-28 max-w-[50rem] scroll-mt-28 sm:mb-40"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
      id="about"
    >
      <SectionHeading>About me</SectionHeading>

      {/* Stats Row */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="rounded-lg border border-black/5 bg-white/60 p-4 text-center backdrop-blur-sm dark:border-white/5 dark:bg-white/5"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="text-accent-teal dark:text-accent-teal-light text-2xl font-bold sm:text-3xl">
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-muted-foreground mt-1 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Tech Stack - spans 2 cols on lg */}
        <motion.div
          className="rounded-lg border border-black/5 bg-white/60 p-6 backdrop-blur-sm lg:col-span-2 dark:border-white/5 dark:bg-white/5"
          custom={0}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h3 className="mb-3 text-lg font-semibold">Tech Stack</h3>
          <p className="text-muted-foreground leading-7">
            My core stack is the{' '}
            <span className="text-foreground font-medium">React Ecosystem</span> and{' '}
            <span className="text-foreground font-medium">Node.js</span>. Experienced in full-stack
            development with <span className="text-foreground font-medium">Next.js</span> and{' '}
            <span className="text-foreground font-medium">MERN stack</span>, with additional
            expertise in monorepos, micro frontends, and cross-platform development across web, iOS,
            and Android.
          </p>
        </motion.div>

        {/* Current Focus */}
        <motion.div
          className="rounded-lg border border-black/5 bg-white/60 p-6 backdrop-blur-sm dark:border-white/5 dark:bg-white/5"
          custom={1}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h3 className="mb-3 text-lg font-semibold">Current Focus</h3>
          <p className="text-muted-foreground leading-7">
            Looking for a{' '}
            <span className="text-foreground font-medium">Technical Lead or Architect</span> role.
            Currently deepening expertise in{' '}
            <span className="text-foreground font-medium">AI tech stack</span>.
          </p>
        </motion.div>

        {/* Expertise */}
        <motion.div
          className="rounded-lg border border-black/5 bg-white/60 p-6 backdrop-blur-sm dark:border-white/5 dark:bg-white/5"
          custom={2}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h3 className="mb-3 text-lg font-semibold">Expertise</h3>
          <ul className="text-muted-foreground space-y-1">
            <li>Monorepos &amp; NX</li>
            <li>Micro Frontends</li>
            <li>Module Federation</li>
            <li>Cross-platform (RN + Web)</li>
          </ul>
        </motion.div>

        {/* Interests - spans 2 cols on lg */}
        <motion.div
          className="rounded-lg border border-black/5 bg-white/60 p-6 backdrop-blur-sm lg:col-span-2 dark:border-white/5 dark:bg-white/5"
          custom={3}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h3 className="mb-3 text-lg font-semibold">Beyond Code</h3>
          <p className="text-muted-foreground leading-7">
            When I&apos;m not working, I enjoy playing chess, reading books, and contributing to
            society. I love learning new things and continuously improving my tech stack.
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}

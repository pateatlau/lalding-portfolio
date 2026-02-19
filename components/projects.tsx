'use client';

import React, { useState } from 'react';
import SectionHeading from './section-heading';
import Project from './project';
import { useSectionInView } from '@/lib/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import type { ProjectData } from '@/lib/types';

const FILTER_STORAGE_KEY = 'project-filter-preference';

export default function Projects({
  projects,
  categories,
}: {
  projects: ProjectData[];
  categories: string[];
}) {
  const { ref } = useSectionInView('Projects', 0.5);

  // Load filter preference from localStorage on mount using lazy initialization
  const [activeFilter, setActiveFilter] = useState(() => {
    if (typeof window === 'undefined') return 'All';
    const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
    return savedFilter && categories.includes(savedFilter) ? savedFilter : 'All';
  });

  // Save filter preference to localStorage when it changes
  const handleFilterChange = (category: string) => {
    setActiveFilter(category);
    if (typeof window !== 'undefined') {
      localStorage.setItem(FILTER_STORAGE_KEY, category);
    }
  };

  const filteredProjects =
    activeFilter === 'All' ? projects : projects.filter((p) => p.category === activeFilter);

  return (
    <section ref={ref} id="projects" className="mb-28 scroll-mt-28">
      <SectionHeading>Featured Projects</SectionHeading>

      {/* Filter Tabs */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleFilterChange(category)}
            className={clsx(
              'cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition',
              activeFilter === category
                ? 'bg-accent-teal dark:bg-accent-teal text-white'
                : 'text-muted-foreground hover:text-foreground border border-black/5 bg-white/60 backdrop-blur-sm hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Projects */}
      <div>
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.title}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Project {...project} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { links } from '@/lib/data';
import Link from 'next/link';
import clsx from 'clsx';
import { useActiveSectionContext } from '@/context/active-section-context';

export default function Header() {
  const { activeSection, setActiveSection, setTimeOfLastClick } = useActiveSectionContext();

  return (
    <header className="relative z-[999]">
      <motion.nav
        className="fixed top-0 left-1/2 flex w-full items-center justify-center rounded-none border border-white/40 bg-white/80 px-4 py-2 shadow-lg shadow-black/[0.03] backdrop-blur-[0.5rem] sm:top-6 sm:w-[36rem] sm:rounded-full sm:px-0 dark:border-black/40 dark:bg-gray-950/75"
        initial={{ y: -100, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
      >
        <ul className="flex w-full flex-wrap items-center justify-center gap-y-1 text-[0.75rem] font-medium text-gray-500 sm:w-[initial] sm:flex-nowrap sm:gap-5 sm:text-[0.9rem]">
          {links.map((link) => (
            <motion.li
              className="relative flex h-3/4 items-center justify-center"
              key={link.hash}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Link
                className={clsx(
                  'flex w-full items-center justify-center px-3 py-3 transition hover:text-gray-950 dark:text-gray-500 dark:hover:text-gray-300',
                  {
                    'text-accent-teal dark:text-accent-teal-light': activeSection === link.name,
                  }
                )}
                href={link.hash}
                onClick={() => {
                  setActiveSection(link.name);
                  setTimeOfLastClick(Date.now());
                }}
                title={`Jump to ${link.name} section`}
              >
                {link.name}

                {link.name === activeSection && (
                  <motion.span
                    className="bg-accent-teal/10 dark:bg-accent-teal/15 absolute inset-0 -z-10 rounded-full"
                    layoutId="activeSection"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  ></motion.span>
                )}
              </Link>
            </motion.li>
          ))}
        </ul>
      </motion.nav>
    </header>
  );
}

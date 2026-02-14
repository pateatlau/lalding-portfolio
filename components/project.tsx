'use client';

import { useRef } from 'react';
import { projectsData } from '@/lib/data';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaGithubSquare } from 'react-icons/fa';
import { FaCaretRight } from 'react-icons/fa';

type ProjectProps = (typeof projectsData)[number];

export default function Project({
  title,
  description,
  tags,
  imageUrl,
  sourceCode,
  liveSite,
}: ProjectProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['0 1', '1.33 1'],
  });
  const scaleProgess = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacityProgess = useTransform(scrollYProgress, [0, 1], [0.6, 1]);

  return (
    <motion.div
      ref={ref}
      style={{
        scale: scaleProgess,
        opacity: opacityProgess,
      }}
      className="group mb-3 sm:mb-8 last:mb-0"
    >
      <section className="bg-gray-100 max-w-[42rem] border border-black/5 rounded-lg overflow-hidden sm:pr-8 relative sm:h-[20rem] hover:bg-gray-200 transition sm:group-even:pl-8 dark:text-white dark:bg-white/10 dark:hover:bg-white/20">
        <div className="pt-4 pb-7 px-5 sm:pl-10 sm:pr-2 sm:pt-10 sm:max-w-[50%] flex flex-col h-full sm:group-even:ml-[18rem]">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="mt-2 leading-relaxed text-gray-700 dark:text-white/70">
            {description}
          </p>
          <ul className="flex flex-wrap mt-4 gap-2 sm:mt-auto">
            {tags.map((tag) => (
              <li
                className="bg-black/[0.7] px-3 py-1 text-[0.7rem] uppercase tracking-wider text-white rounded-full dark:text-white/70"
                key={tag}
              >
                {tag}
              </li>
            ))}
          </ul>
          <div className="flex justify-between flex-row my-4">
            <a
              className="text-slate-500 hover:text-slate-700 transition dark:text-white/70 dark:hover:text-white/80 border rounded-md p-2 border-slate-300 dark:border-white/70 w-30 text-center"
              href={sourceCode}
              target="_blank"
              rel="noopener noreferrer"
              title="View Github repo of this project"
            >
              <span className="flex flex-row justify-between items-center gap-2">
                Source Code
                <FaGithubSquare />
              </span>
            </a>
            <a
              className="text-slate-500 hover:text-slate-700 transition dark:text-white/70 dark:hover:text-white/80 border rounded-md p-2 border-slate-300 dark:border-white/70 w-30 text-center"
              href={liveSite}
              target="_blank"
              rel="noopener noreferrer"
              title="View prod live site of this project"
            >
              <span className="flex flex-row justify-between items-center gap-1">
                Live Site
                <FaCaretRight />
              </span>
            </a>
          </div>
        </div>

        <Image
          src={imageUrl}
          alt={`Screenshot of ${title} project`}
          quality={85}
          className="absolute hidden sm:block top-8 -right-40 w-[28.25rem] rounded-t-lg shadow-2xl
        transition 
        group-hover:scale-[1.04]
        group-hover:-translate-x-3
        group-hover:translate-y-3
        group-hover:-rotate-2

        group-even:group-hover:translate-x-3
        group-even:group-hover:translate-y-3
        group-even:group-hover:rotate-2

        group-even:right-[initial] group-even:-left-40"
        />
      </section>
    </motion.div>
  );
}

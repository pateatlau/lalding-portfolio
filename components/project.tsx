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
      className="group mb-3 last:mb-0 sm:mb-8"
    >
      <section className="relative max-w-2xl overflow-hidden rounded-lg border border-black/5 bg-gray-100 transition hover:bg-gray-200 sm:h-80 sm:pr-8 sm:group-even:pl-8 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
        <div className="flex h-full flex-col px-5 pt-4 pb-7 sm:max-w-[50%] sm:pt-10 sm:pr-2 sm:pl-10 sm:group-even:ml-72">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="mt-2 leading-relaxed text-gray-700 dark:text-white/70">{description}</p>
          <ul className="mt-4 flex flex-wrap gap-2 sm:mt-auto">
            {tags.map((tag) => (
              <li
                className="rounded-full bg-black/70 px-3 py-1 text-[0.7rem] tracking-wider text-white uppercase dark:text-white/70"
                key={tag}
              >
                {tag}
              </li>
            ))}
          </ul>
          <div className="my-4 flex flex-row justify-between">
            <a
              className="w-30 rounded-md border border-slate-300 p-2 text-center text-slate-500 transition hover:text-slate-700 dark:border-white/70 dark:text-white/70 dark:hover:text-white/80"
              href={sourceCode}
              target="_blank"
              rel="noopener noreferrer"
              title="View Github repo of this project"
            >
              <span className="flex flex-row items-center justify-between gap-2">
                Source Code
                <FaGithubSquare />
              </span>
            </a>
            <a
              className="w-30 rounded-md border border-slate-300 p-2 text-center text-slate-500 transition hover:text-slate-700 dark:border-white/70 dark:text-white/70 dark:hover:text-white/80"
              href={liveSite}
              target="_blank"
              rel="noopener noreferrer"
              title="View prod live site of this project"
            >
              <span className="flex flex-row items-center justify-between gap-1">
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
          className="absolute top-8 -right-40 hidden w-[28.25rem] rounded-t-lg shadow-2xl transition group-even:right-[initial] group-even:-left-40 group-hover:-translate-x-3 group-hover:translate-y-3 group-hover:scale-[1.04] group-hover:-rotate-2 group-hover:group-even:translate-x-3 group-hover:group-even:translate-y-3 group-hover:group-even:rotate-2 sm:block"
        />
      </section>
    </motion.div>
  );
}

'use client';

import React from 'react';
import SectionHeading from './section-heading';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { useSectionInView } from '@/lib/hooks';
import { useTheme } from '@/context/theme-context';
import CompaniesSlider from '@/components/companies-slider';
import Image from 'next/image';
import { CgWorkAlt } from 'react-icons/cg';
import { FaReact } from 'react-icons/fa';
import type { ExperienceData, CompanyData } from '@/lib/types';

const iconMap: Record<string, React.ReactNode> = {
  work: React.createElement(CgWorkAlt),
  react: React.createElement(FaReact),
};

export default function Experience({
  experiences,
  companies,
}: {
  experiences: ExperienceData[];
  companies: CompanyData[];
}) {
  const { ref } = useSectionInView('Experience');
  const { theme } = useTheme();

  return (
    <section id="experience" ref={ref} className="mb-28 scroll-mt-28 sm:mb-40">
      <SectionHeading>Career Journey</SectionHeading>
      <VerticalTimeline lineColor={theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}>
        {experiences.map((item) => (
          <React.Fragment key={`${item.title}-${item.company}`}>
            <VerticalTimelineElement
              contentStyle={{
                background: theme === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.05)',
                boxShadow: 'none',
                border:
                  theme === 'light'
                    ? '1px solid rgba(0, 0, 0, 0.05)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                textAlign: 'left',
                padding: '1.3rem 2rem',
                borderRadius: '0.5rem',
                backdropFilter: 'blur(8px)',
              }}
              contentArrowStyle={{
                borderRight: theme === 'light' ? '0.4rem solid #0d9488' : '0.4rem solid #14b8a6',
              }}
              date={item.date}
              icon={iconMap[item.icon] ?? iconMap['work']}
              iconStyle={{
                background: theme === 'light' ? '#0d9488' : '#14b8a6',
                color: 'white',
                fontSize: '1.5rem',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold capitalize">{item.title}</h3>
                  <p className="text-accent-teal dark:text-accent-teal-light mt-0! font-medium">
                    {item.company}
                  </p>
                </div>
                <Image
                  src={item.companylogo}
                  alt={`${item.company} company logo`}
                  height={50}
                  width={50}
                  className="h-10 w-10 shrink-0 rounded-lg sm:h-[50px] sm:w-[50px]"
                />
              </div>
              <p className="text-muted-foreground mt-1! font-normal!">{item.description}</p>
            </VerticalTimelineElement>
          </React.Fragment>
        ))}
      </VerticalTimeline>
      <CompaniesSlider companies={companies} />
    </section>
  );
}

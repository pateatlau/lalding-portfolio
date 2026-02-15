'use client';

import React from 'react';
import SectionHeading from './section-heading';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { experiencesData } from '@/lib/data';
import { useSectionInView } from '@/lib/hooks';
import { useTheme } from '@/context/theme-context';
import CompaniesSlider from '@/components/companies-slider';
import Image from 'next/image';

export default function Experience() {
  const { ref } = useSectionInView('Experience');
  const { theme } = useTheme();

  return (
    <section id="experience" ref={ref} className="mb-28 scroll-mt-28 sm:mb-40">
      <SectionHeading>Experience</SectionHeading>
      <VerticalTimeline lineColor="" animate={true}>
        {experiencesData.map((item) => (
          <React.Fragment key={`${item.title}-${item.location}`}>
            <VerticalTimelineElement
              contentStyle={{
                background: theme === 'light' ? '#f3f4f6' : 'rgba(255, 255, 255, 0.05)',
                boxShadow: 'none',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                textAlign: 'left',
                padding: '1.3rem 2rem',
              }}
              contentArrowStyle={{
                borderRight:
                  theme === 'light'
                    ? '0.4rem solid #9ca3af'
                    : '0.4rem solid rgba(255, 255, 255, 0.5)',
              }}
              date={item.date}
              icon={item.icon}
              iconStyle={{
                background: theme === 'light' ? 'white' : 'rgba(255, 255, 255, 0.15)',
                fontSize: '1.5rem',
              }}
            >
              <div className="flex flex-row justify-between">
                <div>
                  <h3 className="font-semibold capitalize">{item.title}</h3>
                  <p className="mt-0! font-normal">{item.location}</p>
                </div>
                <div>
                  <Image
                    src={item.companylogo}
                    alt={`${item.location} company logo`}
                    height={50}
                    width={50}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <p className="mt-1! font-normal! text-gray-700 dark:text-white/75">
                {item.description}
              </p>
            </VerticalTimelineElement>
          </React.Fragment>
        ))}
      </VerticalTimeline>
      <CompaniesSlider />
    </section>
  );
}

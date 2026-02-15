import { useActiveSectionContext } from '@/context/active-section-context';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import type { SectionName } from './types';

/** Default threshold for intersection observer (75% of element visible) */
const DEFAULT_INTERSECTION_THRESHOLD = 0.75;

/** Minimum time in ms since last click before auto-updating active section */
const CLICK_COOLDOWN_MS = 1000;

export function useSectionInView(
  sectionName: SectionName,
  threshold = DEFAULT_INTERSECTION_THRESHOLD
) {
  const { ref, inView } = useInView({
    threshold,
  });
  const { setActiveSection, timeOfLastClick } = useActiveSectionContext();

  useEffect(() => {
    if (inView && Date.now() - timeOfLastClick > CLICK_COOLDOWN_MS) {
      setActiveSection(sectionName);
    }
  }, [inView, setActiveSection, timeOfLastClick, sectionName]);

  return {
    ref,
  };
}

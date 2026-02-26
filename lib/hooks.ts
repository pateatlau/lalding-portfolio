import { useActiveSectionContext } from '@/context/active-section-context';
import { useAuth } from '@/context/auth-context';
import { downloadResume } from '@/actions/resume';
import { useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';
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

export function useResumeDownload() {
  const { user, isNewUser, clearNewUserFlag } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOptionalFieldsModal, setShowOptionalFieldsModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const triggerDownload = useCallback(async () => {
    setIsDownloading(true);
    const result = await downloadResume();
    setIsDownloading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleResumeClick = useCallback(() => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (isNewUser) {
      setShowOptionalFieldsModal(true);
      return;
    }

    triggerDownload();
  }, [user, isNewUser, triggerDownload]);

  const handleOptionalFieldsComplete = useCallback(() => {
    setShowOptionalFieldsModal(false);
    clearNewUserFlag();
    triggerDownload();
  }, [clearNewUserFlag, triggerDownload]);

  // After OAuth redirect, resume the download flow.
  // Listens for 'auth:signed-in' custom event dispatched by AuthProvider —
  // this is an external event subscription, so setState in the handler is allowed.
  useEffect(() => {
    const handler = async (e: Event) => {
      const pendingAction = localStorage.getItem('pendingAction');
      if (pendingAction !== 'download_resume') return;
      localStorage.removeItem('pendingAction');

      const { isNewUser: isNew } = (e as CustomEvent).detail;
      if (isNew) {
        setShowOptionalFieldsModal(true);
      } else {
        setIsDownloading(true);
        const result = await downloadResume();
        setIsDownloading(false);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if (result.url) {
          window.open(result.url, '_blank', 'noopener,noreferrer');
        }
      }
    };

    window.addEventListener('auth:signed-in', handler);
    return () => window.removeEventListener('auth:signed-in', handler);
  }, []);

  return {
    handleResumeClick,
    isDownloading,
    showLoginModal,
    setShowLoginModal,
    showOptionalFieldsModal,
    handleOptionalFieldsComplete,
  };
}

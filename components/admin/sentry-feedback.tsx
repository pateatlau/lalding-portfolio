'use client';

import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryFeedback() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const feedback = Sentry.getFeedback();
    if (!feedback || !mountRef.current) return;

    const widget = feedback.createWidget();
    mountRef.current.appendChild(widget.el);

    return () => {
      widget.removeFromDom();
    };
  }, []);

  return <div ref={mountRef} />;
}

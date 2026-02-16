'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { updateVisitorOptionalFields } from '@/actions/resume';
import toast from 'react-hot-toast';

type OptionalFieldsModalProps = {
  isOpen: boolean;
  onComplete: () => void;
};

export default function OptionalFieldsModal({ isOpen, onComplete }: OptionalFieldsModalProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { error } = await updateVisitorOptionalFields(company, role);
    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to save details');
    }

    setCompany('');
    setRole('');
    onComplete();
  };

  const handleSkip = () => {
    setCompany('');
    setRole('');
    onComplete();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="fixed top-[20%] left-1/2 z-[9999] w-[min(90vw,24rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-black/10 bg-white/95 p-6 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-gray-900/95"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className="mb-2 text-center text-lg font-semibold dark:text-white">
              Tell me about yourself
            </h2>
            <p className="text-muted-foreground mb-6 text-center text-sm">
              Optional — help me know who&apos;s interested in my work.
            </p>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                maxLength={200}
                className="focus:border-accent-teal/40 dark:focus:border-accent-teal/30 h-12 rounded-lg border border-black/5 bg-white/60 px-4 text-sm backdrop-blur-sm transition-all focus:outline-none dark:border-white/5 dark:bg-white/5 dark:text-white"
              />
              <input
                type="text"
                placeholder="Role / Title"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                maxLength={200}
                className="focus:border-accent-teal/40 dark:focus:border-accent-teal/30 h-12 rounded-lg border border-black/5 bg-white/60 px-4 text-sm backdrop-blur-sm transition-all focus:outline-none dark:border-white/5 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-muted-foreground flex-1 rounded-lg border border-black/5 px-4 py-2.5 text-sm transition hover:bg-black/5 dark:border-white/5 dark:hover:bg-white/5"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-accent-teal hover:bg-accent-teal/90 flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { FaGoogle, FaGithub, FaLinkedin } from 'react-icons/fa';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signInWithProvider } = useAuth();

  const handleLogin = (provider: 'google' | 'github' | 'linkedin_oidc') => {
    // Store pending action so we can resume after OAuth redirect
    localStorage.setItem('pendingAction', 'download_resume');
    signInWithProvider(provider);
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
            onClick={onClose}
          />

          <motion.div
            className="fixed top-[20%] left-1/2 z-[9999] w-[min(90vw,24rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-black/10 bg-white/95 p-6 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-gray-900/95"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className="mb-2 text-center text-lg font-semibold dark:text-white">
              Sign in to download
            </h2>
            <p className="text-muted-foreground mb-6 text-center text-sm">
              Sign in with your social account to download the resume.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleLogin('google')}
                className="flex items-center justify-center gap-3 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <FaGoogle className="text-lg" />
                Continue with Google
              </button>

              <button
                onClick={() => handleLogin('github')}
                className="flex items-center justify-center gap-3 rounded-lg border border-black/10 bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
              >
                <FaGithub className="text-lg" />
                Continue with GitHub
              </button>

              <button
                onClick={() => handleLogin('linkedin_oidc')}
                className="flex items-center justify-center gap-3 rounded-lg border border-[#0077B5]/20 bg-[#0077B5] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#006399]"
              >
                <FaLinkedin className="text-lg" />
                Continue with LinkedIn
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-muted-foreground mt-4 w-full text-center text-sm transition hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

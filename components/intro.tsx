'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BsArrowRight, BsLinkedin } from 'react-icons/bs';
import { HiDownload } from 'react-icons/hi';
import { FaGithubSquare } from 'react-icons/fa';
import { BsBoxArrowRight } from 'react-icons/bs';
import { useSectionInView, useResumeDownload } from '@/lib/hooks';
import { useActiveSectionContext } from '@/context/active-section-context';
import { useAuth } from '@/context/auth-context';
import LoginModal from '@/components/auth/login-modal';
import OptionalFieldsModal from '@/components/auth/optional-fields-modal';
import type { ProfileData } from '@/lib/types';

function TypewriterEffect({ titles }: { titles: string[] }) {
  const [titleIndex, setTitleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentTitle = titles[titleIndex];
    let innerTimeout: ReturnType<typeof setTimeout>;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < currentTitle.length) {
            setCharIndex((prev) => prev + 1);
          } else {
            innerTimeout = setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (charIndex > 0) {
            setCharIndex((prev) => prev - 1);
          } else {
            setIsDeleting(false);
            setTitleIndex((prev) => (prev + 1) % titles.length);
          }
        }
      },
      isDeleting ? 40 : 80
    );

    return () => {
      clearTimeout(timeout);
      clearTimeout(innerTimeout);
    };
  }, [charIndex, isDeleting, titleIndex, titles]);

  const currentTitle = titles[titleIndex];
  const displayText = currentTitle.slice(0, charIndex);

  return (
    <span className="text-accent-teal dark:text-accent-teal-light">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export default function Intro({ profile }: { profile: ProfileData }) {
  const { ref } = useSectionInView('Home', 0.5);
  const { setActiveSection, setTimeOfLastClick } = useActiveSectionContext();
  const {
    handleResumeClick,
    isDownloading,
    showLoginModal,
    setShowLoginModal,
    showOptionalFieldsModal,
    handleOptionalFieldsComplete,
  } = useResumeDownload();
  const { user, visitorProfile, signOut } = useAuth();

  return (
    <>
      <section
        ref={ref}
        id="home"
        className="mb-28 max-w-[50rem] scroll-mt-[100rem] text-center sm:mb-0"
      >
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'tween',
              duration: 0.2,
            }}
          >
            <Image
              src="/lalding.jpg"
              alt={`${profile.fullName} - ${profile.jobTitle} portrait`}
              width="192"
              height="192"
              quality={85}
              priority={true}
              className="h-24 w-24 rounded-full border-[0.35rem] border-white object-cover shadow-xl"
            />
          </motion.div>
        </div>

        <motion.h1
          className="mt-4 mb-4 px-4 text-2xl leading-[1.5]! font-medium sm:text-4xl"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Hello, I am <span className="font-bold">{profile.shortName}</span>
        </motion.h1>

        <motion.div
          className="mb-10 h-10 px-4 text-xl font-medium sm:text-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <TypewriterEffect titles={profile.typewriterTitles} />
        </motion.div>

        <motion.p
          className="text-muted-foreground mx-auto mb-10 max-w-[38rem] px-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {profile.tagline}
        </motion.p>

        <motion.div
          className="flex flex-col items-center justify-center gap-2 px-4 text-lg font-medium sm:flex-row"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1,
          }}
        >
          <Link
            href="#contact"
            className="group flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-white outline-hidden transition hover:scale-110 hover:bg-gray-950 focus:scale-110 active:scale-105"
            onClick={() => {
              setActiveSection('Contact');
              setTimeOfLastClick(Date.now());
            }}
            title="Contact me now!"
          >
            Contact me <BsArrowRight className="opacity-70 transition group-hover:translate-x-1" />
          </Link>

          <button
            className="borderBlack group flex cursor-pointer items-center gap-2 rounded-full bg-white px-7 py-3 outline-hidden transition hover:scale-110 focus:scale-110 active:scale-105 disabled:opacity-50 dark:bg-white/10"
            onClick={handleResumeClick}
            disabled={isDownloading}
            title="Download my resume"
          >
            {isDownloading ? (
              <>
                Downloading...
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-gray-900 dark:border-gray-500 dark:border-t-white" />
              </>
            ) : (
              <>
                Download Resume
                <HiDownload className="opacity-60 transition group-hover:translate-y-1" />
              </>
            )}
          </button>

          {profile.linkedinUrl && (
            <a
              className="borderBlack flex cursor-pointer items-center gap-2 rounded-full bg-white p-4 text-gray-700 transition hover:scale-[1.15] hover:text-gray-950 focus:scale-[1.15] active:scale-105 dark:bg-white/10 dark:text-white/60"
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit my LinkedIn profile"
              aria-label="LinkedIn profile"
            >
              <BsLinkedin />
            </a>
          )}

          {profile.githubUrl && (
            <a
              className="borderBlack flex cursor-pointer items-center gap-2 rounded-full bg-white p-4 text-[1.35rem] text-gray-700 transition hover:scale-[1.15] hover:text-gray-950 focus:scale-[1.15] active:scale-105 dark:bg-white/10 dark:text-white/60"
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit my Github profile"
              aria-label="GitHub profile"
            >
              <FaGithubSquare />
            </a>
          )}

          {user && (
            <button
              className="borderBlack flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-gray-700 transition hover:scale-105 hover:text-gray-950 dark:bg-white/10 dark:text-white/60 dark:hover:text-white"
              onClick={() => signOut()}
              title={`Signed in as ${visitorProfile?.full_name || visitorProfile?.email || 'user'} — click to sign out`}
            >
              {visitorProfile?.avatar_url ? (
                <Image
                  src={visitorProfile.avatar_url}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full"
                />
              ) : null}
              <BsBoxArrowRight className="opacity-60" />
            </button>
          )}
        </motion.div>

        <motion.div
          className="mt-16 hidden sm:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="mx-auto h-8 w-[1px] bg-gray-300 dark:bg-gray-600"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </section>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <OptionalFieldsModal
        isOpen={showOptionalFieldsModal}
        onComplete={handleOptionalFieldsComplete}
      />
    </>
  );
}

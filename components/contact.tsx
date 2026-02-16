'use client';

import React, { useRef } from 'react';
import SectionHeading from './section-heading';
import { motion } from 'framer-motion';
import { useSectionInView } from '@/lib/hooks';
import { sendEmail } from '@/actions/sendEmail';
import SubmitBtn from './submit-btn';
import toast from 'react-hot-toast';
import { BsEnvelope, BsPhone, BsGeoAlt, BsLinkedin, BsGithub } from 'react-icons/bs';
import { useAuth } from '@/context/auth-context';
import type { ProfileData } from '@/lib/types';

export default function Contact({ profile }: { profile: ProfileData }) {
  const { ref } = useSectionInView('Contact');
  const formRef = useRef<HTMLFormElement>(null);
  const { visitorProfile } = useAuth();

  // Key changes when visitor profile loads, re-mounting inputs with pre-filled defaults
  const formKey = visitorProfile?.id ?? 'anon';

  return (
    <motion.section
      id="contact"
      ref={ref}
      className="mb-20 w-[min(100%,56rem)] scroll-mt-28 sm:mb-28"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1 }}
      viewport={{ once: true }}
    >
      <SectionHeading>Let&apos;s Connect</SectionHeading>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-8">
        {/* Contact Info */}
        <div className="md:col-span-2">
          <h3 className="mb-6 text-lg font-semibold">Get in Touch</h3>

          <div className="space-y-4">
            <a
              href={`mailto:${profile.email}`}
              className="hover:border-accent-teal/20 dark:hover:border-accent-teal/15 flex items-start gap-3 rounded-lg border border-black/5 bg-white/60 p-4 backdrop-blur-sm transition dark:border-white/5 dark:bg-white/5"
            >
              <BsEnvelope className="text-accent-teal dark:text-accent-teal-light mt-0.5" />
              <div>
                <div className="text-sm font-medium">Email</div>
                <div className="text-muted-foreground text-sm">{profile.email}</div>
              </div>
            </a>

            {profile.phone && (
              <a
                href={`tel:${profile.phone.replace(/\s/g, '')}`}
                className="hover:border-accent-teal/20 dark:hover:border-accent-teal/15 flex items-start gap-3 rounded-lg border border-black/5 bg-white/60 p-4 backdrop-blur-sm transition dark:border-white/5 dark:bg-white/5"
              >
                <BsPhone className="text-accent-teal dark:text-accent-teal-light mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Phone</div>
                  <div className="text-muted-foreground text-sm">{profile.phone}</div>
                </div>
              </a>
            )}

            {profile.location && (
              <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white/60 p-4 backdrop-blur-sm dark:border-white/5 dark:bg-white/5">
                <BsGeoAlt className="text-accent-teal dark:text-accent-teal-light mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Location</div>
                  <div className="text-muted-foreground text-sm">{profile.location}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-muted-foreground mb-3 text-sm font-medium">Social</h4>
            <div className="flex gap-3">
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent-teal dark:hover:text-accent-teal-light hover:border-accent-teal/20 dark:hover:border-accent-teal/15 flex h-10 w-10 items-center justify-center rounded-lg border border-black/5 bg-white/60 transition dark:border-white/5 dark:bg-white/5"
                  title="Visit my LinkedIn profile"
                  aria-label="LinkedIn profile"
                >
                  <BsLinkedin />
                </a>
              )}
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent-teal dark:hover:text-accent-teal-light hover:border-accent-teal/20 dark:hover:border-accent-teal/15 flex h-10 w-10 items-center justify-center rounded-lg border border-black/5 bg-white/60 transition dark:border-white/5 dark:bg-white/5"
                  title="Visit my GitHub profile"
                  aria-label="GitHub profile"
                >
                  <BsGithub />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-3">
          <form
            ref={formRef}
            className="flex flex-col"
            action={async (formData) => {
              const { error } = await sendEmail(formData);

              if (error) {
                toast.error(error);
                return;
              }

              formRef.current?.reset();
              toast.success('Email sent successfully!');
            }}
          >
            <input
              key={`name-${formKey}`}
              className="focus:border-accent-teal/40 dark:focus:border-accent-teal/30 h-14 rounded-lg border border-black/5 bg-white/60 px-4 backdrop-blur-sm transition-all focus:outline-none dark:border-white/5 dark:bg-white/5 dark:text-white"
              name="senderName"
              type="text"
              maxLength={200}
              placeholder="Your name (optional)"
              defaultValue={visitorProfile?.full_name ?? ''}
            />
            <input
              key={`email-${formKey}`}
              className="focus:border-accent-teal/40 dark:focus:border-accent-teal/30 mt-3 h-14 rounded-lg border border-black/5 bg-white/60 px-4 backdrop-blur-sm transition-all focus:outline-none dark:border-white/5 dark:bg-white/5 dark:text-white"
              name="senderEmail"
              type="email"
              required
              maxLength={500}
              placeholder="Your email"
              defaultValue={visitorProfile?.email ?? ''}
            />
            <textarea
              className="focus:border-accent-teal/40 dark:focus:border-accent-teal/30 my-3 h-40 rounded-lg border border-black/5 bg-white/60 p-4 backdrop-blur-sm transition-all focus:outline-none md:h-52 dark:border-white/5 dark:bg-white/5 dark:text-white"
              name="message"
              placeholder="Your message"
              required
              maxLength={5000}
            />
            <SubmitBtn />
          </form>
        </div>
      </div>
    </motion.section>
  );
}

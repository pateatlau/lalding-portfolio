import React from 'react';
import type { ProfileData } from '@/lib/types';

export default function Footer({ profile }: { profile: ProfileData }) {
  return (
    <footer className="mb-10 px-4 text-center text-gray-500">
      <small className="mb-2 block text-xs">
        &copy; {new Date().getFullYear()} {profile.fullName}
      </small>
      <p className="text-xs">
        <span className="font-semibold">About this website:</span> {profile.footerText}{' '}
        {profile.githubUrl && (
          <a
            href={`${profile.githubUrl}/lalding-portfolio`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            [View source code at GitHub]
          </a>
        )}
      </p>
    </footer>
  );
}

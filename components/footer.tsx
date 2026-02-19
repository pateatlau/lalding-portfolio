import React from 'react';
import type { ProfileData } from '@/lib/types';

export default function Footer({ profile }: { profile: ProfileData }) {
  return (
    <footer className="mb-10 px-4 text-center text-gray-500">
      <small className="block text-xs">
        &copy; {new Date().getFullYear()} {profile.fullName}
      </small>
    </footer>
  );
}

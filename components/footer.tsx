import React from 'react';

export default function Footer() {
  return (
    <footer className="mb-10 px-4 text-center text-gray-500">
      <small className="mb-2 block text-xs">
        &copy; 2025 Laldingliana Tlau Vantawl
      </small>
      <p className="text-xs">
        <span className="font-semibold">About this website:</span> built with
        React & Next.js (App Router & Server Actions), TypeScript, Tailwind CSS,
        Framer Motion, React Email & Resend, Vercel hosting.{' '}
        <a
          href="https://github.com/pateatlau/lalding-portfolio"
          target="_blank"
          className="underline"
        >
          [View source code at Github]
        </a>
      </p>
    </footer>
  );
}

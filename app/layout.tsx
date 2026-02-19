import Header from '@/components/header';
import ScrollProgress from '@/components/scroll-progress';
import CommandPalette from '@/components/command-palette';
import './globals.css';
import { Inter } from 'next/font/google';
import ActiveSectionContextProvider from '@/context/active-section-context';
import Footer from '@/components/footer';
import ThemeSwitch from '@/components/theme-switch';
import ThemeContextProvider from '@/context/theme-context';
import AuthProvider from '@/context/auth-context';
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';
import { getProfileData } from '@/lib/supabase/queries';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

// Sanitize JSON-LD output to prevent XSS via script injection
function escapeJsonLd(jsonString: string): string {
  return jsonString
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export const metadata: Metadata = {
  metadataBase: new URL('https://lalding.in'),
  title: 'Lalding | Full-stack Tech Lead Portfolio',
  description:
    'Laldingliana Tlau Vantawl (Lalding) - Full-stack Tech Lead with 15+ years of experience building scalable web applications. Expert in React, Next.js, TypeScript, and modern web technologies.',
  keywords: [
    'Full-stack Developer',
    'Tech Lead',
    'React',
    'Next.js',
    'TypeScript',
    'Software Engineer',
    'Web Development',
  ],
  authors: [{ name: 'Laldingliana Tlau Vantawl' }],
  creator: 'Laldingliana Tlau Vantawl',
  category: 'technology',
  alternates: {
    canonical: 'https://lalding.in/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lalding.in/',
    siteName: 'Lalding Portfolio',
    title: 'Lalding | Full-stack Tech Lead Portfolio',
    description:
      'Full-stack Tech Lead with 15+ years of experience building scalable web applications.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lalding | Full-stack Tech Lead Portfolio',
    description:
      'Full-stack Tech Lead with 15+ years of experience building scalable web applications.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfileData();

  // Dynamic JSON-LD Person schema from CMS data
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile?.fullName ?? 'Laldingliana Tlau Vantawl',
    alternateName: profile?.shortName ?? 'Lalding',
    url: 'https://lalding.in',
    image: 'https://lalding.in/lalding.jpg',
    jobTitle: profile?.jobTitle ?? 'Full-stack Tech Lead',
    description:
      profile?.tagline ??
      'Full-stack Tech Lead with 15+ years of experience building scalable web applications.',
    worksFor: {
      '@type': 'Organization',
      name: 'HDFC Bank Limited',
    },
    sameAs: [
      profile?.linkedinUrl ?? 'https://www.linkedin.com/in/laldingliana-tv/',
      profile?.githubUrl ?? 'https://github.com/pateatlau',
    ],
    knowsAbout: [
      'React',
      'Next.js',
      'TypeScript',
      'Node.js',
      'Full-stack Development',
      'Web Development',
    ],
  };

  // WebSite schema
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lalding Portfolio',
    url: 'https://lalding.in',
    description:
      'Portfolio of Laldingliana Tlau Vantawl — Full-stack Tech Lead with 15+ years of experience.',
  };

  return (
    <html lang="en" className="scroll-smooth!">
      <head>
        <link rel="icon" href="/lalding.jpg" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: escapeJsonLd(JSON.stringify(personJsonLd)),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: escapeJsonLd(JSON.stringify(websiteJsonLd)),
          }}
        />
      </head>
      <body className={`${inter.className} relative pt-28 sm:pt-36`} suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-gray-900 focus:px-4 focus:py-2 focus:text-white dark:focus:bg-white dark:focus:text-gray-900"
        >
          Skip to main content
        </a>
        <div className="mesh-gradient fixed inset-0 -z-10"></div>

        <ThemeContextProvider>
          <AuthProvider>
            <ActiveSectionContextProvider>
              <ScrollProgress />
              <Header />
              <main id="main">{children}</main>
              <Footer profile={profile} />

              <Toaster position="top-right" />
              <ThemeSwitch />
              <CommandPalette profile={profile} />
            </ActiveSectionContextProvider>
          </AuthProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}

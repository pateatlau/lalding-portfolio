import Header from '@/components/header';
import ScrollProgress from '@/components/scroll-progress';
import CommandPalette from '@/components/command-palette';
import './globals.css';
import { Inter } from 'next/font/google';
import ActiveSectionContextProvider from '@/context/active-section-context';
import Footer from '@/components/footer';
import ThemeSwitch from '@/components/theme-switch';
import ThemeContextProvider from '@/context/theme-context';
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://lalding.in/',
    siteName: 'Lalding Portfolio',
    title: 'Lalding | Full-stack Tech Lead Portfolio',
    description:
      'Full-stack Tech Lead with 15+ years of experience building scalable web applications.',
    images: [
      {
        url: '/lalding.jpg',
        width: 192,
        height: 192,
        alt: 'Laldingliana Tlau Vantawl - Full-stack Tech Lead',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Lalding | Full-stack Tech Lead Portfolio',
    description:
      'Full-stack Tech Lead with 15+ years of experience building scalable web applications.',
    images: ['/lalding.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth!">
      <head>
        <link rel="icon" href="/lalding.jpg" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Laldingliana Tlau Vantawl',
              alternateName: 'Lalding',
              url: 'https://lalding.in',
              image: 'https://lalding.in/lalding.jpg',
              jobTitle: 'Full-stack Tech Lead',
              worksFor: {
                '@type': 'Organization',
                name: 'HDFC Bank Limited',
              },
              sameAs: [
                'https://www.linkedin.com/in/laldingliana-tv/',
                'https://github.com/pateatlau',
              ],
              knowsAbout: [
                'React',
                'Next.js',
                'TypeScript',
                'Node.js',
                'Full-stack Development',
                'Web Development',
              ],
            }),
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
        <div className="bg-blob-primary absolute -top-24 right-0 -z-10 h-[20rem] w-[20rem] rounded-full blur-[8rem] sm:right-44 sm:h-[31.25rem] sm:w-[31.25rem] sm:blur-[10rem] md:w-[68.75rem]"></div>
        <div className="bg-blob-secondary absolute -top-4 -left-48 -z-10 h-[20rem] w-[20rem] rounded-full blur-[8rem] sm:-left-[35rem] sm:h-[31.25rem] sm:w-[50rem] sm:blur-[10rem] md:-left-[33rem] md:w-[68.75rem] lg:-left-[28rem] xl:-left-60 2xl:-left-20"></div>

        <ThemeContextProvider>
          <ActiveSectionContextProvider>
            <ScrollProgress />
            <Header />
            <main id="main">{children}</main>
            <Footer />

            <Toaster position="top-right" />
            <ThemeSwitch />
            <CommandPalette />
          </ActiveSectionContextProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}

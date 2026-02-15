import Header from '@/components/header';
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
      <body
        className={`${inter.className} relative bg-gray-50 pt-28 text-gray-950 sm:pt-36 dark:bg-gray-900 dark:text-gray-50/90`}
        suppressHydrationWarning
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-gray-900 focus:px-4 focus:py-2 focus:text-white dark:focus:bg-white dark:focus:text-gray-900"
        >
          Skip to main content
        </a>
        <div className="absolute -top-24 right-44 -z-10 h-[31.25rem] w-[31.25rem] rounded-full bg-[#fbe2e3] blur-[10rem] sm:w-[68.75rem] dark:bg-[#946263]"></div>
        <div className="absolute -top-4 -left-[35rem] -z-10 h-[31.25rem] w-[50rem] rounded-full bg-[#dbd7fb] blur-[10rem] sm:w-[68.75rem] md:-left-[33rem] lg:-left-[28rem] xl:-left-60 2xl:-left-20 dark:bg-[#676394]"></div>

        <ThemeContextProvider>
          <ActiveSectionContextProvider>
            <Header />
            <main id="main">{children}</main>
            <Footer />

            <Toaster position="top-right" />
            <ThemeSwitch />
          </ActiveSectionContextProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}

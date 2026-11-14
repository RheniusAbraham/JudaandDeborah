import type { Metadata, Viewport } from 'next';
import { Ballet, Spectral } from 'next/font/google';
import { wedding } from '@/lib/wedding';
import './globals.css';

// Names: a ballet-thin script. Everything else: Spectral, a calm screen serif.
const script = Ballet({
  variable: '--font-script',
  subsets: ['latin'],
});

const serif = Spectral({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: `${wedding.partnerOne} & ${wedding.partnerTwo} | Wedding invitation`,
  description: `You are invited to the wedding of ${wedding.partnerOne} and ${wedding.partnerTwo} on ${wedding.dateLabel}.`,
};

export const viewport: Viewport = {
  themeColor: '#fdeee5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Lets the intro start hidden for Anime.js without a flash. No JS: everything just shows.
const jsFlag = `document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${script.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

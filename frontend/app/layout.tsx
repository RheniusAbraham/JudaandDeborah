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

const title = `${wedding.partnerOne} & ${wedding.partnerTwo} | Wedding invitation`;
const description = `You are invited to the wedding of ${wedding.partnerOne} and ${wedding.partnerTwo} on ${wedding.dateLabel}.`;

export const metadata: Metadata = {
  // The site's public address, so link previews (WhatsApp, Instagram...) can find the preview
  // image (app/opengraph-image.jpg). Set NEXT_PUBLIC_SITE_URL when you publish; on Vercel the
  // deployment address is used automatically.
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title,
  description,
  openGraph: { title: `${wedding.partnerOne} & ${wedding.partnerTwo}`, description, type: 'website' },
  twitter: { card: 'summary_large_image', title: `${wedding.partnerOne} & ${wedding.partnerTwo}`, description },
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

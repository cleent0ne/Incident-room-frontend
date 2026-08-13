import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Manrope, DM_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ClaimAttemptsToast } from '@/components/ui/claim-attempts-toast';
import { CrackOverlay } from '@/components/ui/crack-overlay';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

const SITE_URL =
  process.env.SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'Incident Room',
    template: '%s · Incident Room',
  },

  description: 'Learn incident response by running the room.',

  // ✅ ADD THIS PART
  verification: {
    google: 'M-BkwG-6ju5O3VDbokiZa6K87KmYY2oyfPz740uPE-4',
  },

  openGraph: {
    siteName: 'Incident Room',
    title: 'Incident Room',
    description: 'Learn incident response by running the room.',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Incident Room',
    description: 'Learn incident response by running the room.',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Forces dynamic rendering for CSP nonce
  await headers();

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${dmMono.variable}`}
    >
      {/* Google tag (gtag.js) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-1THSJMF111"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1THSJMF111');
        `}
      </Script>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Header />
            {children}
            <Footer />
            <ClaimAttemptsToast />
            <CrackOverlay />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
import type { Metadata } from 'next';
import { Manrope, DM_Mono } from 'next/font/google';
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

// SITE_URL is required for absolute URLs in metadataBase / OG tags / sitemap.xml /
// robots.txt (all server-only — see .env.example). Falls back to localhost so `next
// dev` without a configured .env.local doesn't crash, matching the BACKEND_BASE_URL
// fallback pattern in next.config.js.
const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Incident Room',
    template: '%s · Incident Room',
  },
  description: 'Learn incident response by running the room.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${dmMono.variable}`}>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Header />
            <ClaimAttemptsToast />
            {children}
            <Footer />
          </ToastProvider>
        </AuthProvider>
        <CrackOverlay />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { Toaster } from '@/components/ui/toaster';
import { KeepAlive } from '@/components/keep-alive';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'VELORA — Wear your identity',
  description: 'Premium clothing for the modern individual. Discover elegance, identity, and confidence.',
  keywords: ['VELORA', 'clothing', 'fashion', 'premium', 'elegance'],
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'VELORA — Wear your identity',
    description: 'Premium clothing for the modern individual.',
    siteName: 'VELORA',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL?.replace('/api', 'https://velora-api-w930.onrender.com') || 'https://velora-api-w930.onrender.com'} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL?.replace('/api', 'https://velora-api-w930.onrender.com') || 'https://velora-api-w930.onrender.com'} />
      </head>
      <body className={`${inter.variable} ${playfair.variable} min-h-dynamic bg-brand-ivory`}>
        <QueryProvider>
          <AuthProvider>
            <LocaleProvider>
              {children}
              <Toaster />
              <KeepAlive />
            </LocaleProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

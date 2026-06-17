import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { Toaster } from '@/components/ui/toaster';

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
    <html lang="es-CO">
      <body className="min-h-screen bg-brand-ivory">
        <QueryProvider>
          <AuthProvider>
            <LocaleProvider>
              {children}
              <Toaster />
            </LocaleProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

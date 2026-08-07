'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/providers/locale-provider';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ConfirmForm() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      return;
    }

    const exchangeCode = async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      // We only use this to confirm the email link is valid; the user
      // still logs in normally afterwards, so drop this session.
      await supabase.auth.signOut();
      setStatus(error ? 'error' : 'success');
    };

    exchangeCode();
  }, [searchParams]);

  return (
    <div className="flex min-h-dynamic flex-col items-center justify-center bg-brand-ivory px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-display text-3xl font-bold tracking-[0.3em]">
          VELORA
        </Link>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          {status === 'loading' && <p className="text-sm text-brand-stone">{t('auth.confirming')}</p>}
          {status === 'success' && (
            <>
              <h1 className="text-xl font-semibold">{t('auth.emailConfirmed')}</h1>
              <p className="mt-2 text-sm text-brand-stone">{t('auth.emailConfirmedDetail')}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-xl font-semibold">{t('auth.confirmError')}</h1>
              <p className="mt-2 text-sm text-brand-stone">{t('auth.confirmErrorDetail')}</p>
            </>
          )}
          <p className="mt-6">
            <Link href="/auth/login" className="text-xs font-medium text-brand-black underline underline-offset-4">
              {t('auth.backToSignIn')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmForm />
    </Suspense>
  );
}
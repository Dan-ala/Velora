'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/providers/locale-provider';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const { locale, t } = useLocale();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    setIsSending(true);
    setError('');
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    sendingRef.current = false;
    setIsSending(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-dynamic flex-col items-center justify-center bg-brand-ivory px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-display text-3xl font-bold tracking-[0.3em]">VELORA</Link>
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {sent ? (
            <>
              <h1 className="text-xl font-semibold">{t('auth.checkEmail')}</h1>
              <p className="mt-2 text-sm text-brand-stone">{t('auth.resetSent', { email })}</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold">{t('auth.resetPassword')}</h1>
              <p className="mt-1 text-sm text-brand-stone">{t('auth.resetInstructions')}</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-brand-stone">{t('auth.email')}</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="mt-1.5 w-full rounded-xl border bg-brand-ivory/50 px-4 py-3 text-sm focus:border-brand-gold focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                <button type="submit" disabled={isSending} className="flex h-12 w-full items-center justify-center rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white disabled:opacity-50">
                  {isSending ? t('auth.sending') || 'Sending...' : t('auth.sendResetLink')}
                </button>
              </form>
              <p className="mt-6 text-center text-xs text-brand-stone">
                <Link href="/auth/login" className="text-brand-black underline underline-offset-4">{t('auth.backToSignIn')}</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

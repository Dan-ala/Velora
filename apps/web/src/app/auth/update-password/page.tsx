'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/providers/locale-provider';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

function UpdatePasswordForm() {
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setSessionError(true);
      return;
    }

    const exchangeCode = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setError(exchangeError.message);
        setSessionError(true);
      }
      setIsLoading(false);
    };

    exchangeCode();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('auth.passwordMinError'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setIsUpdating(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsUpdating(false);
    } else {
      setUpdated(true);
      setIsUpdating(false);
    }
  };

  if (sessionError) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold">{t('auth.invalidResetLink')}</h1>
        <p className="mt-2 text-sm text-brand-stone">{t('auth.resetLinkExpired')}</p>
        <Link
          href="/auth/reset-password"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand-black px-8 text-sm font-medium uppercase tracking-wider text-white"
        >
          {t('auth.requestNewLink')}
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
        <p className="text-sm text-brand-stone">{t('common.loading')}</p>
      </div>
    );
  }

  if (updated) {
    return (
      <>
        <h1 className="text-xl font-semibold">{t('auth.passwordUpdated')}</h1>
        <p className="mt-2 text-sm text-brand-stone">{t('auth.passwordUpdateSuccess')}</p>
        <Link
          href="/auth/login"
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white"
        >
          {t('auth.signIn')}
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">{t('auth.updatePassword')}</h1>
      <p className="mt-1 text-sm text-brand-stone">{t('auth.chooseNewPassword')}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>
        )}

        <div>
          <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-brand-stone">
            {t('auth.newPassword')}
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border bg-brand-ivory/50 px-4 py-3 pr-10 text-sm focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-stone hover:text-brand-black"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-brand-stone">{t('auth.minChars')}</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-xs font-medium uppercase tracking-wider text-brand-stone">
            {t('auth.confirmPassword')}
          </label>
          <div className="relative mt-1.5">
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border bg-brand-ivory/50 px-4 py-3 pr-10 text-sm focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-stone hover:text-brand-black"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90 disabled:opacity-50"
        >
          {isUpdating ? t('auth.updatingPassword') || 'Updating...' : t('auth.updatePassword')}
        </button>
      </form>
    </>
  );
}

export default function UpdatePasswordPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-dynamic flex-col items-center justify-center bg-brand-ivory px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="mb-8 block text-center font-display text-3xl font-bold tracking-[0.3em]">
          VELORA
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <Suspense fallback={
            <div className="text-center">
              <p className="text-sm text-brand-stone">{t('common.loading')}</p>
            </div>
          }>
            <UpdatePasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}

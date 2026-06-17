'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useLocale } from '@/providers/locale-provider';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { locale, t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password.length < 8) {
      setError(t('auth.passwordMinError'));
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', { email, password });
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err?.message || t('auth.registrationFailed'));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-ivory px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="mb-8 block text-center font-display text-3xl font-bold tracking-[0.3em]">
          VELORA
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold">{t('auth.createAccount')}</h1>
          <p className="mt-1 text-sm text-brand-stone">{t('auth.join')}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>
            )}

            <div>
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-brand-stone">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border bg-brand-ivory/50 px-4 py-3 text-sm focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-brand-stone">
                {t('auth.password')}
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

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-brand-black/90 disabled:opacity-50"
            >
              {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-brand-stone">
            {t('auth.haveAccount')}{' '}
            <Link href="/auth/login" className="font-medium text-brand-black underline underline-offset-4">
              {t('auth.signInLink')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

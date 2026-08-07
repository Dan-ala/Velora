'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useLocale } from '@/providers/locale-provider';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

// Mirrors the backend rules in apps/api/src/routes/auth.ts so the user
// gets instant feedback instead of a round-trip error.
function getPasswordChecks(password: string) {
  return {
    length: password.length >= 10,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
}

function passwordScore(checks: ReturnType<typeof getPasswordChecks>) {
  return Object.values(checks).filter(Boolean).length;
}

export default function RegisterPage() {
  const { locale, t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const checks = getPasswordChecks(password);
  const score = passwordScore(checks);
  const allChecksPass = Object.values(checks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!allChecksPass) {
      setError(t('auth.passwordRequirementsError'));
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', { email, password });
      setRegistered(true);
    } catch (err: any) {
      setError(err?.message || t('auth.registrationFailed'));
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="flex min-h-dynamic flex-col items-center justify-center bg-brand-ivory px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Link href="/" className="mb-8 block text-center font-display text-3xl font-bold tracking-[0.3em]">
            VELORA
          </Link>
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold">{t('auth.checkEmail')}</h1>
            <p className="mt-2 text-sm text-brand-stone">{t('auth.confirmSent', { email })}</p>
            <p className="mt-6 text-center text-xs text-brand-stone">
              <Link href="/auth/login" className="font-medium text-brand-black underline underline-offset-4">
                {t('auth.backToSignIn')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

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
                  minLength={10}
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

              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < score
                            ? score <= 2
                              ? 'bg-destructive'
                              : score <= 4
                                ? 'bg-brand-gold'
                                : 'bg-green-600'
                            : 'bg-brand-stone/20'
                        }`}
                      />
                    ))}
                  </div>
                  <ul className="mt-2 space-y-0.5 text-[10px] text-brand-stone">
                    <li className={checks.length ? 'text-green-600' : ''}>
                      {checks.length ? '✓' : '·'} {t('auth.reqLength')}
                    </li>
                    <li className={checks.upper && checks.lower ? 'text-green-600' : ''}>
                      {checks.upper && checks.lower ? '✓' : '·'} {t('auth.reqCase')}
                    </li>
                    <li className={checks.number ? 'text-green-600' : ''}>
                      {checks.number ? '✓' : '·'} {t('auth.reqNumber')}
                    </li>
                    <li className={checks.special ? 'text-green-600' : ''}>
                      {checks.special ? '✓' : '·'} {t('auth.reqSpecial')}
                    </li>
                  </ul>
                </div>
              )}
              {password.length === 0 && (
                <p className="mt-1 text-[10px] text-brand-stone">{t('auth.minChars')}</p>
              )}
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
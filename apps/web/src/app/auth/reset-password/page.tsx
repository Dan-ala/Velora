'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-ivory px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-display text-3xl font-bold tracking-[0.3em]">VELORA</Link>
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {sent ? (
            <>
              <h1 className="text-xl font-semibold">Check your email</h1>
              <p className="mt-2 text-sm text-brand-stone">We sent a password reset link to {email}</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold">Reset password</h1>
              <p className="mt-1 text-sm text-brand-stone">We'll email you a reset link</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-brand-stone">Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="mt-1.5 w-full rounded-xl border bg-brand-ivory/50 px-4 py-3 text-sm focus:border-brand-gold focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                <button type="submit" className="flex h-12 w-full items-center justify-center rounded-full bg-brand-black text-sm font-medium uppercase tracking-wider text-white">
                  Send Reset Link
                </button>
              </form>
              <p className="mt-6 text-center text-xs text-brand-stone">
                <Link href="/auth/login" className="text-brand-black underline underline-offset-4">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

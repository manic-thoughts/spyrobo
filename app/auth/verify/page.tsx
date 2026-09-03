'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, CheckCircle2 } from 'lucide-react';

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirectTarget = searchParams.get('redirect') || '/';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          router.replace(redirectTarget !== '/' ? redirectTarget : '/jira/projects');
        }
      })
      .catch(() => {});
  }, [redirectTarget, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        // Redirect to target or main landing page after verification
        router.push(redirectTarget);
      }, 600);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Verify Your Email</h1>
          <p className="text-xs font-semibold text-slate-500">
            We sent a 6-digit verification code to <strong className="text-slate-800">{email || 'your email'}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block text-center">Enter 6-Digit OTP Code</label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              autoFocus
              className="w-full tracking-[12px] text-center text-2xl font-black font-mono py-3 rounded-xl border border-slate-300 text-emerald-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified! Opening SPYROBO Platform...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Verifying Code...' : 'Verify & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}

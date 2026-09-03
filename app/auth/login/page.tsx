'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, Mail, ArrowRight, CheckCircle2, Info } from 'lucide-react';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Redirect to verification screen with return URL
      router.push(`/auth/verify?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTarget)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SPYROBO</h1>
          <p className="text-xs font-semibold text-slate-500">
            Unified Workflow Attention Layer • SaaS Authentication
          </p>
        </div>

        {/* Integration Account Notice */}
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 space-y-1 font-medium">
          <div className="flex items-center gap-1.5 font-extrabold text-emerald-800">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Important Account Binding Note</span>
          </div>
          <p className="leading-relaxed">
            Please sign in with the email address registered with the service you wish to integrate (such as Jira or GitHub) so your workspace cards match automatically.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Work or Service Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Sending Verification Code...' : 'Continue with OTP Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Feature Callout */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600 font-medium">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Secure Passwordless Brevo OTP Verification</span>
          </div>
          <p>
            We will deliver a 6-digit verification code directly to your email inbox via Brevo SMTP to verify your identity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}

'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Next.js App Error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="glass-card max-w-lg w-full p-8 bg-white text-center space-y-6 shadow-xl rounded-2xl border border-rose-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Application Error Encountered</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            We caught an error while rendering this page. You can retry loading or return to the projects gateway.
          </p>
        </div>

        {error?.message && (
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-left text-xs font-mono text-rose-700 overflow-x-auto max-h-36">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-2 shadow-xs"
          >
            <RotateCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <a
            href="/jira/projects"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Projects Gateway</span>
          </a>
        </div>
      </div>
    </div>
  );
}

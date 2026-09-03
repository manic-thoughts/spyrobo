'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { 
  Zap, 
  Sparkles, 
  GitPullRequest, 
  ArrowRight, 
  Target, 
  ShieldCheck 
} from 'lucide-react';

export default function MainPlatformLandingPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const fetchUserAndSummary = async () => {
    try {
      const [summaryRes, userRes] = await Promise.all([
        fetch('/api/dashboard/summary'),
        fetch('/api/auth/me'),
      ]);
      const summaryJson = await summaryRes.json();
      const userJson = await userRes.json();

      setData(summaryJson);
      if (userJson.user && userJson.authenticated) {
        setUser(userJson.user);
      }
    } catch (err) {
      console.error('Failed to load main landing data:', err);
    }
  };

  useEffect(() => {
    fetchUserAndSummary();
  }, []);

  const handleJiraActionClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/auth/login?redirect=/jira/projects');
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar
        unreadCount={data?.metrics?.unreadCount || 0}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          isMockMode={data?.isMockMode}
          lastSyncAt={data?.lastSyncAt}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />

        <main className="p-6 md:p-10 space-y-10 flex-1 max-w-7xl w-full mx-auto">
          {/* Welcome Hero Banner */}
          <div className="p-8 md:p-10 rounded-3xl bg-emerald-800 text-white shadow-sm border border-emerald-700 space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-300" />
              <span className="text-[11px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-600">
                Unified Workflow Attention Tool
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              {user ? `About SPYROBO — Welcome, ${user.displayName || user.email.split('@')[0]} 👋` : 'About SPYROBO'}
            </h1>
            <p className="text-sm md:text-base text-emerald-100 font-medium max-w-3xl leading-relaxed">
              SPYROBO is an intelligent Workflow Attention Tool over your engineering tools. Monitor Jira tickets, overdue work, and quality validation rules in one clean place.
            </p>

            <div className="pt-2 flex items-center gap-4 flex-wrap">
              {user ? (
                <Link
                  href="/jira/projects"
                  className="px-5 py-3 rounded-xl font-black text-xs bg-white text-emerald-900 hover:bg-emerald-50 transition shadow-sm flex items-center gap-2"
                >
                  <span>Open My Jira Projects</span>
                  <ArrowRight className="w-4 h-4 text-emerald-700" />
                </Link>
              ) : (
                <Link
                  href="/auth/login?redirect=/jira/projects"
                  className="px-5 py-3 rounded-xl font-black text-xs bg-white text-emerald-900 hover:bg-emerald-50 transition shadow-sm flex items-center gap-2"
                >
                  <span>Sign In with Work Email to Start</span>
                  <ArrowRight className="w-4 h-4 text-emerald-700" />
                </Link>
              )}
            </div>
          </div>

          {/* About Us & Platform Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What is SPYROBO */}
            <div className="glass-card p-6 md:p-8 bg-white border border-slate-200 space-y-3 shadow-xs rounded-2xl">
              <div className="flex items-center gap-2.5 text-emerald-700 font-black text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>What is SPYROBO?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                SPYROBO is a personal visibility and attention layer built over Jira and engineering workflow tools. It monitors your tickets, evaluates deterministic rules (overdue work, quality fields, due dates), and presents a clear project dashboard.
              </p>
            </div>

            {/* Our Aim & Idea */}
            <div className="glass-card p-6 md:p-8 bg-white border border-slate-200 space-y-3 shadow-xs rounded-2xl">
              <div className="flex items-center gap-2.5 text-emerald-700 font-black text-sm">
                <Target className="w-5 h-5 text-emerald-600" />
                <span>Our Aim & Idea</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                To eliminate scattered notification emails and continuous tab-checking. By combining Jira Cloud with upcoming GitHub PR streams, SPYROBO ensures you and your team never miss critical deadlines or incomplete cards.
              </p>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="space-y-5">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span>Available Integrations & Project Workspaces</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jira Card */}
              <div className="glass-card p-6 md:p-8 bg-white border-2 border-emerald-200 hover:border-emerald-400 space-y-5 shadow-xs transition rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                      J
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Jira Cloud Integration</h3>
                      <p className="text-xs text-slate-500 font-medium">Personal cards, due dates & quality validation</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Connect your Jira Cloud project scope to automatically surface overdue work, upcoming due dates, and required-field quality alerts.
                </p>

                <Link
                  href="/jira/projects"
                  onClick={handleJiraActionClick}
                  className="w-full py-3.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Select or Connect Jira Projects</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* GitHub Card */}
              <div className="glass-card p-6 md:p-8 bg-slate-50 border border-slate-200 opacity-90 space-y-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitPullRequest className="w-10 h-10 text-slate-500" />
                    <div>
                      <h3 className="text-base font-black text-slate-700">GitHub Stream</h3>
                      <p className="text-xs text-slate-500 font-medium">PR review requests & build status checks</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-700">
                    Coming Soon
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Will surface requested PR reviews, stale branches, and failed build checks alongside Jira cards.
                </p>

                <button
                  disabled
                  className="w-full py-3.5 rounded-xl font-bold text-xs bg-slate-200 text-slate-500 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>GitHub Integration (Coming Soon)</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

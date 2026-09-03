'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AttentionList from '@/components/dashboard/AttentionList';
import { 
  Zap, 
  Layers, 
  Sparkles, 
  FolderKanban, 
  GitPullRequest, 
  ArrowRight, 
  Target, 
  ShieldCheck, 
  Key, 
  Globe, 
  Mail, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';

export default function WorkflowsLandingHub() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGuiConnect, setShowGuiConnect] = useState(false);

  // GUI Jira Form state
  const [jiraSiteInput, setJiraSiteInput] = useState('https://spyrobo.atlassian.net');
  const [jiraEmailInput, setJiraEmailInput] = useState('');
  const [jiraTokenInput, setJiraTokenInput] = useState('');
  const [connectMessage, setConnectMessage] = useState('');
  const [connecting, setConnecting] = useState(false);

  const fetchSummaryAndUser = async () => {
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
        setJiraEmailInput(userJson.user.email || '');
      }
    } catch (err) {
      console.error('Failed to load workflows hub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryAndUser();
  }, []);

  const handleJiraActionClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/auth/login?redirect=/jira/projects');
    }
  };

  const handleGuiConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login?redirect=/workflows');
      return;
    }

    setConnecting(true);
    setConnectMessage('');

    try {
      const res = await fetch('/api/jira/connect-gui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraSite: jiraSiteInput,
          jiraEmail: jiraEmailInput || user.email,
          jiraApiToken: jiraTokenInput,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to connect Jira');

      setConnectMessage('✓ Jira Cloud GUI credentials saved and connected successfully!');
      setTimeout(() => setShowGuiConnect(false), 2000);
      await fetchSummaryAndUser();
    } catch (err: any) {
      setConnectMessage(`Error: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar unreadCount={data?.metrics?.unreadCount || 0} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} isMockMode={data?.isMockMode} lastSyncAt={data?.lastSyncAt} />

        <main className="p-6 md:p-10 space-y-10 flex-1 max-w-7xl w-full mx-auto">
          {/* Welcome Hero Banner */}
          <div className="p-8 md:p-10 rounded-3xl bg-emerald-800 text-white shadow-sm border border-emerald-700 space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-300" />
              <span className="text-[11px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-600">
                Unified Workflow Attention Layer
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              {user ? `Welcome back, ${user.displayName || user.email.split('@')[0]} 👋` : 'Welcome to SPYROBO Platform'}
            </h1>
            <p className="text-sm md:text-base text-emerald-100 font-medium max-w-3xl leading-relaxed">
              SPYROBO brings your scattered engineering tools into a single prioritized attention stream. Monitor Jira tickets, overdue work, and missing quality fields without continuous tab-checking.
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

              <button
                onClick={() => setShowGuiConnect(!showGuiConnect)}
                className="px-4 py-3 rounded-xl font-extrabold text-xs bg-emerald-900/80 hover:bg-emerald-900 text-emerald-100 border border-emerald-600 transition flex items-center gap-2"
              >
                <Key className="w-4 h-4 text-emerald-300" />
                <span>GUI Jira Credentials Setup</span>
              </button>
            </div>
          </div>

          {/* GUI Jira Credentials Setup Panel */}
          {showGuiConnect && (
            <div className="glass-card p-6 md:p-8 bg-white border-2 border-emerald-300 rounded-3xl space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base">
                    J
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">GUI Jira Connection Setup</h3>
                    <p className="text-xs text-slate-500 font-medium">Connect your live Atlassian Jira Cloud instance directly from the UI</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuiConnect(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  Close ✕
                </button>
              </div>

              <form onSubmit={handleGuiConnectSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                  <div className="space-y-1.5">
                    <label className="text-slate-700 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-600" /> Jira Site Domain
                    </label>
                    <input
                      type="url"
                      value={jiraSiteInput}
                      onChange={(e) => setJiraSiteInput(e.target.value)}
                      placeholder="https://your-domain.atlassian.net"
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-600" /> Atlassian Account Email
                    </label>
                    <input
                      type="email"
                      value={jiraEmailInput}
                      onChange={(e) => setJiraEmailInput(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-600" /> Atlassian API Token
                    </label>
                    <input
                      type="password"
                      value={jiraTokenInput}
                      onChange={(e) => setJiraTokenInput(e.target.value)}
                      placeholder="ATATT3xFfGF0..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    💡 Need an Atlassian API token? Create one here →
                  </a>

                  <button
                    type="submit"
                    disabled={connecting}
                    className="py-2.5 px-6 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-50"
                  >
                    {connecting ? 'Saving GUI Connection...' : 'Save & Connect Jira GUI'}
                  </button>
                </div>

                {connectMessage && (
                  <p className="text-xs font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    {connectMessage}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* About Us & Platform Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What is SPYROBO */}
            <div className="glass-card p-6 md:p-8 bg-white border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-700 font-black text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>What is SPYROBO?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                SPYROBO is an intelligent personal visibility layer over Jira and engineering workflows. It consumes your tickets, evaluates deterministic rules (overdue work, quality fields, due dates), and presents a single prioritized dashboard instead of requiring you to monitor Jira manually.
              </p>
            </div>

            {/* Our Aim & Idea */}
            <div className="glass-card p-6 md:p-8 bg-white border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-700 font-black text-sm">
                <Target className="w-5 h-5 text-emerald-600" />
                <span>Our Aim & Idea</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                To transform scattered notification emails and continuous tab-checking into actionable clarity. By combining Jira Cloud with upcoming GitHub PR streams, SPYROBO ensures you and your team never miss critical deadlines or incomplete cards.
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
              <div className="glass-card p-6 md:p-8 bg-white border-2 border-emerald-200 hover:border-emerald-400 space-y-5 shadow-xs transition">
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

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-1.5 font-medium">
                  <div className="flex items-center justify-between font-bold">
                    <span>Connected Projects:</span>
                    <span className="font-black text-emerald-700">PROJ, DEV, PAYMENT</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Same email binding automatically matches your Jira assignee cards.
                  </p>
                </div>

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
              <div className="glass-card p-6 md:p-8 bg-slate-50 border border-slate-200 opacity-90 space-y-5">
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

                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1 font-medium">
                  <span className="font-bold text-slate-800 block">Upcoming Extension Slot:</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Will surface requested PR reviews, stale branches, and failed build checks alongside Jira cards.
                  </p>
                </div>

                <button
                  disabled
                  className="w-full py-3.5 rounded-xl font-bold text-xs bg-slate-200 text-slate-500 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>GitHub Integration (Coming Soon)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attention Stream */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Platform Attention Stream Overview</span>
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 rounded-xl bg-slate-200/60 animate-pulse border border-slate-300/40" />
                ))}
              </div>
            ) : (
              <AttentionList items={data?.topAttentionItems || []} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

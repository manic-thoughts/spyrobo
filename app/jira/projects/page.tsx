'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { 
  FolderKanban, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Key, 
  Globe, 
  Mail, 
  Lock 
} from 'lucide-react';

export default function JiraProjectsGatewayPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [showGuiConnect, setShowGuiConnect] = useState(false);

  // GUI Jira Credentials state
  const [jiraSiteInput, setJiraSiteInput] = useState('');
  const [jiraEmailInput, setJiraEmailInput] = useState('');
  const [jiraTokenInput, setJiraTokenInput] = useState('');
  const [connectMessage, setConnectMessage] = useState('');
  const [connecting, setConnecting] = useState(false);

  const router = useRouter();

  const fetchProjectsAndUser = async () => {
    try {
      const [projRes, userRes] = await Promise.all([
        fetch('/api/jira/projects'),
        fetch('/api/auth/me'),
      ]);
      const projJson = await projRes.json();
      const userJson = await userRes.json();

      if (!userJson.authenticated || !userJson.user) {
        router.push('/auth/login?redirect=/jira/projects');
        return;
      }

      setProjects(projJson.projects || []);
      if (userJson.user) {
        setUser(userJson.user);
        setJiraEmailInput(userJson.user.jiraEmail || userJson.user.email || '');
        setJiraSiteInput(userJson.user.jiraSite || '');
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndUser();
  }, []);

  const handleSelectProject = (projectKey: string) => {
    router.push(`/jira/projects/${projectKey}/dashboard`);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey) return;
    setAdding(true);

    const key = newKey.toUpperCase().trim();
    try {
      await fetch('/api/jira/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectKey: key, name: newName || key }),
      });
      router.push(`/jira/projects/${key}/dashboard`);
    } catch (err) {
      console.error('Failed to add project:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleGuiConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setConnectMessage('');

    try {
      const res = await fetch('/api/jira/connect-gui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraSite: jiraSiteInput,
          jiraEmail: jiraEmailInput,
          jiraApiToken: jiraTokenInput,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to connect Jira');

      setConnectMessage('✓ Jira Cloud GUI credentials saved and connected successfully!');
      setTimeout(() => setShowGuiConnect(false), 2000);
      await fetchProjectsAndUser();
    } catch (err: any) {
      setConnectMessage(`Error: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />

        <main className="p-6 md:p-8 space-y-8 flex-1 max-w-5xl w-full mx-auto">
          {/* Hero Welcome Step */}
          <div className="p-6 rounded-2xl bg-emerald-800 text-white shadow-xs border border-emerald-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-6 h-6 text-emerald-300" />
                <h2 className="text-xl font-black tracking-tight">Step 1: Select or Connect a Jira Project</h2>
              </div>
              <button
                onClick={() => setShowGuiConnect(!showGuiConnect)}
                className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-900 hover:bg-emerald-950 text-emerald-100 border border-emerald-600 transition flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-emerald-300" />
                <span>Configure Live Jira Credentials</span>
              </button>
            </div>
            <p className="text-xs text-emerald-100 font-medium leading-relaxed max-w-2xl">
              Choose an active project below to open its dedicated Attention Dashboard, Notifications, Cards stream, and Quality Validation rules.
            </p>
          </div>

          {/* GUI Jira Credentials Setup Panel */}
          {showGuiConnect && (
            <div className="glass-card p-6 bg-white border-2 border-emerald-300 rounded-2xl space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                    J
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">GUI Jira Connection Setup</h3>
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
                      <Mail className="w-4 h-4 text-emerald-600" /> Jira Account Email
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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
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
                    className="py-2.5 px-5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-50"
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

          {/* Connected Projects Selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center justify-between">
              <span>Select Active Project ({projects.length})</span>
              <span className="text-xs text-slate-500 font-normal">Click any project to enter its dashboard</span>
            </h3>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-32 rounded-2xl bg-slate-200/60 animate-pulse border border-slate-300/40" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id || proj.projectKey}
                    onClick={() => handleSelectProject(proj.projectKey)}
                    className="glass-card p-5 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all duration-200 space-y-3 group rounded-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-emerald-700 tracking-tight group-hover:scale-105 transition-transform">
                        {proj.projectKey}
                      </span>
                      <span className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-800 transition">
                        {proj.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium truncate">{proj.jiraSite}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                      <span>Open Workspace</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Project Card */}
          <div className="glass-card p-6 bg-white border border-slate-200 space-y-4 rounded-2xl">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Connect New Jira Project Scope</span>
            </h3>

            <form onSubmit={handleAddProject} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Project Key (e.g. PAYMENT)"
                required
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project Name (e.g. Stripe Gateway)"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={adding || !newKey}
                className="py-2.5 px-4 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{adding ? 'Connecting...' : 'Connect & Open Project'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

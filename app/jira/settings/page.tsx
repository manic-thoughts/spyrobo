'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Settings, CheckCircle2, Sliders, Server, Lock, UserCheck, Mail, Globe, Key } from 'lucide-react';

export default function JiraSettingsPage() {
  const [connectInfo, setConnectInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [jiraSiteInput, setJiraSiteInput] = useState('');
  const [jiraEmailInput, setJiraEmailInput] = useState('');
  const [jiraTokenInput, setJiraTokenInput] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'description',
    'assignee',
    'startDate',
    'dueDate',
    'labels',
    'storyPoints',
    'originalEstimate',
    'priority',
    'sprint',
  ]);
  const [policyMessage, setPolicyMessage] = useState('');

  const fetchAuthUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setJiraEmailInput(data.user.jiraEmail || data.user.email || '');
        setJiraSiteInput(data.user.jiraSite || '');
      }
    } catch (err) {
      console.error('Failed to fetch auth user:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.requiredFields) {
        setSelectedFields(data.requiredFields);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/jira/connect');
      const json = await res.json();
      setConnectInfo(json);
    } catch (err) {
      console.error('Connection test failed:', err);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchAuthUser();
    fetchSettings();
    testConnection();
  }, []);

  const handleSaveJiraBinding = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSavedMessage('✓ Jira Cloud GUI credentials and email binding saved!');
      setTimeout(() => setSavedMessage(''), 4000);
      await testConnection();
    } catch (err: any) {
      setSavedMessage(`Error: ${err.message}`);
    }
  };

  const handleToggleField = async (fieldKey: string) => {
    const updated = selectedFields.includes(fieldKey)
      ? selectedFields.filter((f) => f !== fieldKey)
      : [...selectedFields, fieldKey];

    setSelectedFields(updated);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requiredFields: updated }),
      });
      setPolicyMessage('✓ Quality policy updated & saved to Database!');
      setTimeout(() => setPolicyMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save quality policy:', err);
    }
  };

  const requiredFieldOptions = [
    { key: 'description', label: 'Description' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'labels', label: 'Labels' },
    { key: 'storyPoints', label: 'Story Points' },
    { key: 'originalEstimate', label: 'Original Estimate' },
    { key: 'priority', label: 'Priority' },
    { key: 'sprint', label: 'Sprint' },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isMobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-6 md:p-8 space-y-6 flex-1 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <span>Quality Policy & Notification Settings</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Configure your Quality Policy rules and notification preferences
            </p>
          </div>

          {/* Connection Test Status */}
          <div className="glass-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Jira Connection Diagnostic</h3>
                  <p className="text-xs text-slate-500">Test live server API handshake with Atlassian Cloud</p>
                </div>
              </div>

              <button
                onClick={testConnection}
                disabled={testing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {connectInfo && (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-800">
                    Status: {connectInfo.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">{connectInfo.message}</p>
                {connectInfo.user && (
                  <div className="mt-2 pt-2 border-t border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>User: <strong className="text-slate-900">{connectInfo.user.displayName}</strong></div>
                    <div>Account ID: <strong className="text-slate-900">{connectInfo.user.jiraAccountId}</strong></div>
                    <div>Site: <strong className="text-slate-900">{connectInfo.user.jiraSite}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quality Rules Card */}
          <div className="glass-card p-6 bg-white space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 text-teal-700 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Required-Field Quality Policy</h3>
                <p className="text-xs text-slate-500">
                  Issues missing any enabled field will trigger a grouped Quality Warning notification
                </p>
              </div>
            </div>

            {policyMessage && (
              <p className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                {policyMessage}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {requiredFieldOptions.map((field) => {
                const isChecked = selectedFields.includes(field.key);

                return (
                  <div
                    key={field.key}
                    onClick={() => handleToggleField(field.key)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isChecked
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">{field.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Box */}
          <div className="p-4 rounded-xl bg-emerald-100/60 border border-emerald-300 flex items-start gap-3 text-xs text-slate-700">
            <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-900 font-bold block mb-0.5">Security Guarantee</strong>
              Jira API tokens and credentials configured via GUI are stored securely per-user and never exposed to public browser scripts.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

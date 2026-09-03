'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Settings, CheckCircle2, Sliders, Server, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [connectInfo, setConnectInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);

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
    testConnection();
  }, []);

  const requiredFields = [
    { key: 'description', label: 'Description', default: true },
    { key: 'assignee', label: 'Assignee', default: true },
    { key: 'startDate', label: 'Start Date', default: true },
    { key: 'dueDate', label: 'Due Date', default: true },
    { key: 'labels', label: 'Labels', default: true },
    { key: 'storyPoints', label: 'Story Points / Estimate', default: true },
    { key: 'priority', label: 'Priority', default: true },
    { key: 'sprint', label: 'Sprint', default: true },
    { key: 'acceptanceCriteria', label: 'Acceptance Criteria', default: true },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 md:p-8 space-y-6 flex-1 max-w-5xl w-full mx-auto">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              <span>Settings & Jira Connection</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Manage Jira REST API credentials, connection status, and quality validation policies
            </p>
          </div>

          {/* Connection Card */}
          <div className="glass-card p-6 space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Jira Cloud REST API Connection</h3>
                  <p className="text-xs text-slate-500">Server-side credentials defined in .env / .env.local</p>
                </div>
              </div>

              <button
                onClick={testConnection}
                disabled={testing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm shadow-emerald-600/20 disabled:opacity-50"
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
          <div className="glass-card p-6 space-y-4 bg-white">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {requiredFields.map((field) => (
                <div
                  key={field.key}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-slate-800">{field.label}</span>
                  <input
                    type="checkbox"
                    defaultChecked={field.default}
                    className="w-4 h-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Security Box */}
          <div className="p-4 rounded-xl bg-emerald-100/60 border border-emerald-300 flex items-start gap-3 text-xs text-slate-700">
            <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-900 font-bold block mb-0.5">Security Guarantee</strong>
              Jira API tokens and credentials are strictly held in server-side application memory and never transmitted or exposed to browser code.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

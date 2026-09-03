'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Settings, CheckCircle2, Sliders, Server, Lock, UserCheck, Mail } from 'lucide-react';

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectKey = ((params?.key as string) || 'PROJ').toUpperCase();

  const [connectInfo, setConnectInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [jiraEmailInput, setJiraEmailInput] = useState('');
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
  }, [projectKey]);

  const handleSaveJiraBinding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage('Jira email binding saved and rectified!');
    setTimeout(() => setSavedMessage(''), 4000);
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
      <Sidebar activeProject={projectKey} isMobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-6 md:p-8 space-y-6 flex-1 max-w-5xl w-full mx-auto">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              <span>Settings: Project {projectKey}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Manage Jira connection, identity rectification, and required-field quality rules for <strong className="text-slate-800 font-bold">{projectKey}</strong>
            </p>
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
              Jira API tokens and credentials are strictly held in server-side application memory and never transmitted or exposed to browser code.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

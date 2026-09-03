'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { ExternalLink, AlertTriangle, FileWarning, Calendar, Bug, Zap, BookOpen, CheckSquare, GitCommit, Layers } from 'lucide-react';
import { getStoryMissingFieldNames } from '@/lib/rules/missing-fields';

function evaluateCardFlags(issue: any, currentUserEmail?: string, currentUserId?: string, requiredFields?: string[]) {
  let isOverdue = false;
  let isMissingFields = false;
  let missingFieldNames: string[] = [];

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (issue?.dueDate) {
      const due = new Date(issue.dueDate);
      if (!isNaN(due.getTime())) {
        const dueCalendarDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        isOverdue = dueCalendarDate < startOfToday && issue?.statusCategory !== 'DONE';
      }
    }

    const isReporterMe = Boolean(
      (currentUserEmail && issue?.reporterEmail && issue.reporterEmail.toLowerCase() === currentUserEmail.toLowerCase()) ||
      (currentUserId && issue?.reporterId === currentUserId)
    );

    if (isReporterMe) {
      missingFieldNames = getStoryMissingFieldNames(issue, requiredFields);
      isMissingFields = missingFieldNames.length > 0;
    }
  } catch (e) {
    isOverdue = false;
    isMissingFields = false;
    missingFieldNames = [];
  }

  return { isOverdue, isMissingFields, missingFieldNames };
}

function getIssueTypeBadge(issueType?: string) {
  const type = (issueType || 'Story').toLowerCase();
  if (type.includes('bug')) {
    return { label: 'Bug', icon: Bug, style: 'bg-rose-100 text-rose-800 border-rose-300' };
  }
  if (type.includes('epic')) {
    return { label: 'Epic', icon: Zap, style: 'bg-purple-100 text-purple-800 border-purple-300' };
  }
  if (type.includes('sub')) {
    return { label: 'Subtask', icon: GitCommit, style: 'bg-slate-100 text-slate-700 border-slate-300' };
  }
  if (type.includes('task')) {
    return { label: 'Task', icon: CheckSquare, style: 'bg-sky-100 text-sky-800 border-sky-300' };
  }
  return { label: 'Story', icon: BookOpen, style: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
}

function ProjectCardItem({ issue, user, requiredFields }: { issue: any; user?: any; requiredFields?: string[] }) {
  const { isOverdue, isMissingFields, missingFieldNames } = evaluateCardFlags(issue, user?.jiraEmail || user?.email, user?.jiraAccountId, requiredFields);
  const typeBadge = getIssueTypeBadge(issue?.issueType);
  const TypeIcon = typeBadge.icon;

  return (
    <div className="glass-card p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-sm text-emerald-700">{issue.issueKey}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border flex items-center gap-1 ${typeBadge.style}`}>
            <TypeIcon className="w-3 h-3" />
            <span>{typeBadge.label}</span>
          </span>
          <span className="text-sm font-bold text-slate-900 truncate">{issue.summary}</span>

          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {issue.status}
          </span>

          {isOverdue && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Overdue
            </span>
          )}

          {isMissingFields && (
            <span
              title={`Missing required fields: ${missingFieldNames.join(', ')}`}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"
            >
              <FileWarning className="w-3 h-3" /> Incomplete ({missingFieldNames.join(', ')})
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap font-medium">
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            Assigned: {issue.assigneeName || issue.assigneeEmail || (issue.assigneeId ? 'Assigned' : 'Unassigned')}
          </span>
          {issue.reporterName && (
            <span className="text-slate-500 font-semibold">
              Reporter: {issue.reporterName}
            </span>
          )}

          {issue.dueDate ? (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Due: <strong className="text-slate-800">{new Date(issue.dueDate).toISOString().split('T')[0]}</strong>
            </span>
          ) : (
            <span className="text-rose-600 font-bold">No Due Date</span>
          )}

          {issue.storyPoints !== null && issue.storyPoints !== undefined ? (
            <span>Points: <strong className="text-slate-800">{issue.storyPoints}</strong></span>
          ) : (
            <span className="text-amber-700 font-bold">No Points</span>
          )}

          {issue.labels && issue.labels.length > 0 ? (
            <div className="flex items-center gap-1">
              {issue.labels.map((l: string) => (
                <span key={l} className="px-1.5 py-0.5 rounded bg-emerald-50 text-[10px] text-emerald-800 font-bold border border-emerald-200">
                  {l}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-purple-700 font-bold">No Labels</span>
          )}
        </div>
      </div>

      <a
        href={issue.jiraUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition shrink-0 self-end md:self-center border border-slate-300"
      >
        <span>Open Jira</span>
        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
      </a>
    </div>
  );
}

export default function ProjectCardsPage() {
  const params = useParams();
  const projectKey = ((params?.key as string) || 'PROJ').toUpperCase();

  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('assigned');

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const [issuesRes, userRes] = await Promise.all([
        fetch(`/api/issues?projectKey=${projectKey}&filter=${filter}`),
        fetch('/api/auth/me'),
      ]);
      const issuesJson = await issuesRes.json();
      const userJson = await userRes.json();

      setData(issuesJson);
      if (userJson.user) setUser(userJson.user);
    } catch (err) {
      console.error('Failed to load project cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [projectKey, filter]);

  const tabs = [
    { label: `Assigned to Me (${filter === 'assigned' ? data?.totalCount || 0 : ''})`, value: 'assigned' },
    { label: 'All Project Cards', value: 'all' },
    { label: 'Reported by Me', value: 'reported' },
    { label: 'Overdue Cards', value: 'overdue' },
    { label: 'Incomplete Quality Cards', value: 'incomplete' },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeProject={projectKey} isMobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <main className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Project Cards ({projectKey})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Synchronized Jira ticket cards assigned to <strong className="text-slate-800 font-bold">{user?.jiraEmail || user?.email || 'you'}</strong> in project <strong className="text-slate-800 font-bold">{projectKey}</strong>
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === tab.value
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-emerald-700 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards List */}
          {loading ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-600">Loading synchronized Jira cards...</p>
            </div>
          ) : (data?.issues || []).length === 0 ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">0 Incomplete Cards Found</h3>
                <p className="text-xs text-slate-500 max-w-sm font-medium">
                  {filter === 'incomplete'
                    ? 'Zero incomplete cards found! All your reported stories meet 100% of required quality standards.'
                    : 'No matching ticket cards found for this filter.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.issues || []).map((issue: any) => (
                <ProjectCardItem key={issue.jiraId || issue.issueKey} issue={issue} user={user} requiredFields={data?.requiredFields} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

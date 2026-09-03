'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/dashboard/MetricCard';
import AttentionList from '@/components/dashboard/AttentionList';
import { AlertTriangle, Clock, FileWarning, UserCheck, ShieldAlert, Sparkles, FolderKanban } from 'lucide-react';

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectKey = ((params?.key as string) || 'PROJ').toUpperCase();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | null>('ASSIGNED');
  const [subFilter, setSubFilter] = useState<'all' | 'assigned' | 'reported'>('all');

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/dashboard/summary?projectKey=${projectKey}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load project summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTrigger = async () => {
    try {
      await fetch('/api/jira/sync', { method: 'POST' });
      await fetchSummary();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      await fetchSummary();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [projectKey]);

  const metrics = data?.metrics || {
    overdueCount: 0,
    assignedOverdueCount: 0,
    reportedOverdueCount: 0,
    dueRemindersCount: 0,
    assignedRemindersCount: 0,
    reportedRemindersCount: 0,
    missingFieldsCount: 0,
    assignmentCount: 0,
    unreadCount: 0,
    totalAttentionCount: 0,
  };

  const isItemAssignedToMe = (item: any) =>
    item.issue?.assigneeId === data?.user?.jiraAccountId ||
    (item.issue?.assigneeEmail && item.issue.assigneeEmail.toLowerCase() === data?.user?.email?.toLowerCase());

  const isItemReportedByMe = (item: any) =>
    item.issue?.reporterId === data?.user?.jiraAccountId ||
    (item.issue?.reporterEmail && item.issue.reporterEmail.toLowerCase() === data?.user?.email?.toLowerCase());

  const allItems = data?.allNotifications || data?.topAttentionItems || [];
  const filteredItems = allItems
    .filter((item: any) => {
      if (!selectedFilter || selectedFilter === 'ASSIGNED') return item.type === 'ASSIGNED';
      if (selectedFilter === 'OVERDUE') {
        if (subFilter === 'assigned') return item.type === 'OVERDUE' && isItemAssignedToMe(item);
        if (subFilter === 'reported') return item.type === 'OVERDUE' && isItemReportedByMe(item);
        return item.type === 'OVERDUE';
      }
      if (selectedFilter === 'DUE_SOON') {
        const isReminder = item.type === 'DUE_SOON' || item.type === 'DUE_TODAY';
        if (subFilter === 'assigned') return isReminder && isItemAssignedToMe(item);
        if (subFilter === 'reported') return isReminder && isItemReportedByMe(item);
        return isReminder;
      }
      if (selectedFilter === 'MISSING_FIELDS') return item.type === 'MISSING_FIELDS';
      return true;
    })
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        activeProject={projectKey}
        unreadCount={metrics.unreadCount}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={data?.user}
          isMockMode={data?.isMockMode}
          lastSyncAt={data?.lastSyncAt}
          onSyncTrigger={handleSyncTrigger}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />

        <main className="p-6 md:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
          {/* Welcome Banner - Project Scoped */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-emerald-800 text-white shadow-xs border border-emerald-700">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-6 h-6 text-emerald-300" />
                <h2 className="text-xl font-black tracking-tight">
                  Project Workspace: <span className="underline decoration-emerald-400">{projectKey}</span>
                </h2>
                <Sparkles className="w-5 h-5 text-emerald-300" />
              </div>
              <p className="text-sm text-emerald-100 font-medium">
                Attention metrics and quality validation rules strictly scoped to Jira project <strong className="text-white font-bold">{projectKey}</strong>.
              </p>
            </div>

            {selectedFilter && selectedFilter !== 'ASSIGNED' && (
              <button
                onClick={() => { setSelectedFilter('ASSIGNED'); setSubFilter('all'); }}
                className="self-start md:self-center px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-900 hover:bg-emerald-950 text-white transition border border-emerald-600"
              >
                Reset to All Assignments
              </button>
            )}
          </div>

          {/* Attention Counters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Overdue Work"
              count={metrics.overdueCount || 0}
              subtitle="Action required"
              icon={AlertTriangle}
              variant="overdue"
              isSelected={selectedFilter === 'OVERDUE'}
              onClick={() => { setSelectedFilter(selectedFilter === 'OVERDUE' ? 'ASSIGNED' : 'OVERDUE'); setSubFilter('all'); }}
            />
            <MetricCard
              title="Due Reminders"
              count={metrics.dueRemindersCount || metrics.dueSoonCount || 0}
              subtitle="Due soon & today"
              icon={Clock}
              variant="due-today"
              isSelected={selectedFilter === 'DUE_SOON'}
              onClick={() => { setSelectedFilter(selectedFilter === 'DUE_SOON' ? 'ASSIGNED' : 'DUE_SOON'); setSubFilter('all'); }}
            />
            <MetricCard
              title="Quality Warnings"
              count={metrics.missingFieldsCount || 0}
              subtitle="Reported by me missing fields"
              icon={FileWarning}
              variant="quality"
              isSelected={selectedFilter === 'MISSING_FIELDS'}
              onClick={() => { setSelectedFilter(selectedFilter === 'MISSING_FIELDS' ? 'ASSIGNED' : 'MISSING_FIELDS'); setSubFilter('all'); }}
            />
            <MetricCard
              title="All Assignments"
              count={metrics.assignmentCount || 0}
              subtitle="Assigned to you (latest first)"
              icon={UserCheck}
              variant="assigned"
              isSelected={selectedFilter === 'ASSIGNED'}
              onClick={() => { setSelectedFilter('ASSIGNED'); setSubFilter('all'); }}
            />
          </div>

          {/* Main Action Stream */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                <span>
                  {selectedFilter === 'OVERDUE' && 'OVERDUE CARDS'}
                  {selectedFilter === 'DUE_SOON' && 'DUE REMINDERS'}
                  {selectedFilter === 'MISSING_FIELDS' && 'QUALITY WARNINGS (REPORTED BY ME)'}
                  {(!selectedFilter || selectedFilter === 'ASSIGNED') && `ALL ASSIGNMENTS (${projectKey})`}
                </span>
              </h3>

              {/* Sub-category breakdown pills for Overdue and Due Reminders */}
              {selectedFilter === 'OVERDUE' && (
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setSubFilter('all')}
                    className={`px-3 py-1 rounded-lg transition ${subFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All Overdue ({metrics.overdueCount || 0})
                  </button>
                  <button
                    onClick={() => setSubFilter('assigned')}
                    className={`px-3 py-1 rounded-lg transition ${subFilter === 'assigned' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Assigned Overdue ({metrics.assignedOverdueCount || 0})
                  </button>
                  <button
                    onClick={() => setSubFilter('reported')}
                    className={`px-3 py-1 rounded-lg transition ${subFilter === 'reported' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Reported Overdue ({metrics.reportedOverdueCount || 0})
                  </button>
                </div>
              )}

              {selectedFilter === 'DUE_SOON' && (
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setSubFilter('all')}
                    className={`px-3 py-1 rounded-lg transition ${subFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    All Reminders ({metrics.dueRemindersCount || 0})
                  </button>
                  <button
                    onClick={() => setSubFilter('assigned')}
                    className={`px-3 py-1 rounded-lg transition ${subFilter === 'assigned' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Assigned Reminders ({metrics.assignedRemindersCount || 0})
                  </button>
                  <button
                    onClick={() => setSubFilter('reported')}
                    className={`px-3 py-1 rounded-lg transition ${subFilter === 'reported' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Reported Reminders ({metrics.reportedRemindersCount || 0})
                  </button>
                </div>
              )}
              <span className="text-xs text-slate-500 font-medium">
                Deterministic rules for project {projectKey}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 rounded-xl bg-slate-200/60 animate-pulse border border-slate-300/40" />
                ))}
              </div>
            ) : (
              <AttentionList items={filteredItems} onMarkRead={handleMarkRead} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/dashboard/MetricCard';
import AttentionList from '@/components/dashboard/AttentionList';
import { AlertTriangle, Clock, FileWarning, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

export default function JiraDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | null>('ASSIGNED');

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
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
  }, []);

  const metrics = data?.metrics || {
    overdueCount: 0,
    dueSoonCount: 0,
    missingFieldsCount: 0,
    assignmentCount: 0,
    unreadCount: 0,
    totalAttentionCount: 0,
  };

  const allItems = data?.allNotifications || data?.topAttentionItems || [];
  const filteredItems = allItems
    .filter((item: any) => {
      if (!selectedFilter || selectedFilter === 'ASSIGNED') return item.type === 'ASSIGNED';
      if (selectedFilter === 'OVERDUE') return item.type === 'OVERDUE';
      if (selectedFilter === 'DUE_SOON') return item.type === 'DUE_SOON' || item.type === 'DUE_TODAY';
      if (selectedFilter === 'MISSING_FIELDS') return item.type === 'MISSING_FIELDS';
      return true;
    })
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar unreadCount={metrics.unreadCount} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={data?.user}
          isMockMode={data?.isMockMode}
          lastSyncAt={data?.lastSyncAt}
          onSyncTrigger={handleSyncTrigger}
        />

        <main className="p-6 md:p-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
          {/* Welcome Banner - Solid Emerald Green (NO Gradient) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-emerald-800 text-white shadow-sm border border-emerald-700">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">
                  Good afternoon, {data?.user?.displayName || 'Developer'}
                </h2>
                <Sparkles className="w-5 h-5 text-emerald-300" />
              </div>
              <p className="text-sm text-emerald-100 font-medium">
                You have <strong className="text-emerald-300 font-extrabold">{metrics.totalAttentionCount} items</strong> requiring your attention right now.
              </p>
            </div>

            {selectedFilter && (
              <button
                onClick={() => setSelectedFilter(null)}
                className="self-start md:self-center px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-900 hover:bg-emerald-950 text-white transition border border-emerald-600"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Attention Counters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Overdue Work"
              count={metrics.overdueCount}
              subtitle="Action required"
              icon={AlertTriangle}
              variant="overdue"
              isSelected={selectedFilter === 'OVERDUE'}
              onClick={() => setSelectedFilter(selectedFilter === 'OVERDUE' ? null : 'OVERDUE')}
            />
            <MetricCard
              title="Due Today / Soon"
              count={metrics.dueSoonCount}
              subtitle="Within 3 days"
              icon={Clock}
              variant="due-today"
              isSelected={selectedFilter === 'DUE_SOON'}
              onClick={() => setSelectedFilter(selectedFilter === 'DUE_SOON' ? null : 'DUE_SOON')}
            />
            <MetricCard
              title="Quality Warnings"
              count={metrics.missingFieldsCount}
              subtitle="Missing required fields"
              icon={FileWarning}
              variant="quality"
              isSelected={selectedFilter === 'MISSING_FIELDS'}
              onClick={() => setSelectedFilter(selectedFilter === 'MISSING_FIELDS' ? null : 'MISSING_FIELDS')}
            />
            <MetricCard
              title="New Assignments"
              count={metrics.assignmentCount}
              subtitle="Assigned to you"
              icon={UserCheck}
              variant="assigned"
              isSelected={selectedFilter === 'ASSIGNED'}
              onClick={() => setSelectedFilter(selectedFilter === 'ASSIGNED' ? null : 'ASSIGNED')}
            />
          </div>

          {/* Main Action Stream */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                <span>NEEDS ATTENTION</span>
                {selectedFilter && (
                  <span className="text-xs font-bold text-emerald-700">({selectedFilter})</span>
                )}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Sorted by deterministic business rules
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

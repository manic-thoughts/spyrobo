'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AttentionList from '@/components/dashboard/AttentionList';
import { Bell, CheckCheck } from 'lucide-react';

export default function JiraNotificationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    try {
      let url = `/api/notifications?unreadOnly=${unreadOnly}`;
      if (typeFilter !== 'ALL') {
        url += `&type=${typeFilter}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter, unreadOnly]);

  const categories = [
    { label: 'All Alerts', value: 'ALL' },
    { label: 'Status & Comments', value: 'STATUS_AND_COMMENTS' },
    { label: 'Overdue', value: 'OVERDUE' },
    { label: 'Due Soon / Today', value: 'DUE_SOON' },
    { label: 'Quality Warnings', value: 'MISSING_FIELDS' },
    { label: 'Assignments', value: 'ASSIGNED' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar unreadCount={data?.unreadCount || 0} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* Header Controls */}
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <span>Jira Notifications Center</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Notification history with event_key non-spam deduplication
            </p>
          </div>

          {/* Filter Bar - Strictly 1 Single Row (No Wrapping) */}
          <div className="glass-card p-2 bg-white overflow-x-auto">
            <div className="flex items-center gap-1 flex-nowrap whitespace-nowrap min-w-max">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setTypeFilter(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    typeFilter === cat.value
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 rounded-xl bg-slate-200/60 animate-pulse border border-slate-300/40" />
              ))}
            </div>
          ) : (
            <AttentionList items={data?.notifications || []} />
          )}
        </main>
      </div>
    </div>
  );
}

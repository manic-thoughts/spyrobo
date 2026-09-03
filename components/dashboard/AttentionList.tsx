'use client';

import React from 'react';
import { ExternalLink, AlertTriangle, Clock, FileWarning, UserCheck, CheckCircle, Bug, Zap, BookOpen, CheckSquare, GitCommit, MessageSquare, RefreshCw } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'ASSIGNED' | 'MISSING_FIELDS' | 'STATUS_CHANGE' | 'COMMENT_ADDED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  message: string;
  readAt?: string | null;
  issue?: {
    issueKey: string;
    summary: string;
    issueType?: string;
    status: string;
    priority: string;
    jiraUrl: string;
    dueDate?: string | null;
    labels?: string[];
    assigneeName?: string | null;
    assigneeEmail?: string | null;
    assigneeId?: string | null;
    reporterName?: string | null;
    reporterEmail?: string | null;
  };
}

export default function AttentionList({
  items,
  onMarkRead,
}: {
  items: NotificationItem[];
  onMarkRead?: (id: string) => void;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900">0 Notifications Found</h3>
          <p className="text-xs text-slate-500 max-w-sm font-medium">
            You are all caught up! There are no matching unread notifications or alerts for this filter.
          </p>
        </div>
      </div>
    );
  }

  const getTypeBadge = (type: NotificationItem['type']) => {
    switch (type) {
      case 'OVERDUE':
        return {
          label: 'OVERDUE',
          style: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: AlertTriangle,
        };
      case 'DUE_TODAY':
        return {
          label: 'DUE TODAY',
          style: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Clock,
        };
      case 'DUE_SOON':
        return {
          label: 'DUE SOON',
          style: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Clock,
        };
      case 'MISSING_FIELDS':
        return {
          label: 'QUALITY WARNING',
          style: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: FileWarning,
        };
      case 'ASSIGNED':
        return {
          label: 'NEW ASSIGNMENT',
          style: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: UserCheck,
        };
      case 'STATUS_CHANGE':
        return {
          label: 'STATUS UPDATED',
          style: 'bg-sky-100 text-sky-800 border-sky-300',
          icon: RefreshCw,
        };
      case 'COMMENT_ADDED':
        return {
          label: 'NEW COMMENT',
          style: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: MessageSquare,
        };
      default:
        return {
          label: 'ACTIVITY',
          style: 'bg-teal-100 text-teal-800 border-teal-200',
          icon: Clock,
        };
    }
  };

  const getIssueTypeBadge = (issueType?: string) => {
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
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const badge = getTypeBadge(item.type);
        const typeBadge = getIssueTypeBadge(item.issue?.issueType);
        const BadgeIcon = badge.icon;
        const TypeIcon = typeBadge.icon;
        const jiraUrl = item.issue?.jiraUrl || '#';

        return (
          <div
            key={item.id}
            className={`glass-card p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
              item.type === 'OVERDUE' ? 'glass-card-overdue' : ''
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-2 rounded-xl border mt-0.5 ${badge.style}`}>
                <BadgeIcon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-emerald-800">{item.issue?.issueKey || 'JIRA'}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${typeBadge.style}`}>
                    <TypeIcon className="w-3 h-3" />
                    <span>{typeBadge.label}</span>
                  </span>
                  <span className="text-xs text-slate-300">—</span>
                  <span className="text-sm font-bold text-slate-900">{item.issue?.summary || item.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.style}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.message}</p>

                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold flex-wrap pt-0.5">
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Assigned: {item.issue?.assigneeName || item.issue?.assigneeEmail || (item.issue?.assigneeId ? 'Assigned' : 'Unassigned')}
                  </span>
                  <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Reported by: {item.issue?.reporterName || item.issue?.reporterEmail || 'Me'}
                  </span>
                  {item.issue?.status && (
                    <span className="text-slate-500">
                      Status: <strong className="text-slate-800">{item.issue.status}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <a
                href={jiraUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm shadow-emerald-600/20"
              >
                <span>Open in Jira</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

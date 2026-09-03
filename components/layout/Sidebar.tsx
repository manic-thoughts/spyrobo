'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Zap, 
  LayoutDashboard, 
  Bell, 
  CreditCard, 
  FolderKanban, 
  Settings, 
  Scan, 
  ChevronDown, 
  GitPullRequest,
  Sparkles,
  ArrowRightLeft,
  X,
  LogOut,
  LogIn,
  Info
} from 'lucide-react';
import LogoutModal from './LogoutModal';

export default function Sidebar({
  activeProject,
  unreadCount = 0,
  isMobileOpen = false,
  onMobileClose,
}: {
  activeProject?: string;
  unreadCount?: number;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const [jiraOpen, setJiraOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user && data?.user?.isVerified) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, []);

  const isLoggedIn = Boolean(currentUser && currentUser.isVerified);

  // If activeProject is provided, scope routes to /jira/projects/${activeProject}/...
  const currentProjectKey = activeProject || (pathname.includes('/jira/projects/') ? pathname.split('/')[3] : '');

  const jiraSubItems = currentProjectKey
    ? [
        { name: 'Dashboard', href: `/jira/projects/${currentProjectKey}/dashboard`, icon: LayoutDashboard },
        { name: 'Notifications', href: `/jira/projects/${currentProjectKey}/notifications`, icon: Bell, badge: unreadCount },
        { name: 'My Cards', href: `/jira/projects/${currentProjectKey}/cards`, icon: CreditCard },
        { name: 'Project Settings', href: `/jira/projects/${currentProjectKey}/settings`, icon: Settings },
      ]
    : [
        { name: 'All Notifications', href: '/jira/notifications', icon: Bell, badge: unreadCount },
        { name: 'Workspace Settings', href: '/jira/settings', icon: Settings },
      ];

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth/login';
    } catch (err) {
      console.error('Failed to log out:', err);
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const sidebarContent = (
    <div className="p-4 flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        {/* Top Branding Header */}
        <div className="flex items-center justify-between">
          <Link href="/" onClick={onMobileClose} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xs">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-900 tracking-tight">
                SPYROBO
              </h1>
              <p className="text-xs text-slate-500 font-medium">Workflow Attention Tool</p>
            </div>
          </Link>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden transition"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section 1: About Button */}
        <div>
          <Link
            href="/"
            onClick={onMobileClose}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition border ${
              pathname === '/'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300/80 shadow-2xs'
                : 'text-slate-700 hover:bg-emerald-50/60 hover:border-emerald-200 border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>About SPYROBO</span>
            </div>
          </Link>
        </div>

        {/* Navigation Section 2: JIRA Integration Stream */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Integrations
              </span>
            </div>

            {/* Jira Main Parent */}
            <div className="space-y-1">
              <button
                onClick={() => setJiraOpen(!jiraOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition border ${
                  pathname.startsWith('/jira')
                    ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className={`w-4 h-4 ${pathname.startsWith('/jira') ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>Jira Cloud</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${jiraOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Jira Sub-Items */}
              {jiraOpen && (
                <div className="pl-3 pt-1 space-y-1 border-l-2 border-slate-100 ml-4">
                  {/* Select/Change Project Button */}
                  <Link
                    href="/jira/projects"
                    onClick={onMobileClose}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      pathname === '/jira/projects'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className={`w-3.5 h-3.5 ${pathname === '/jira/projects' ? 'text-white' : 'text-slate-500'}`} />
                      <span>{currentProjectKey ? `Project: ${currentProjectKey}` : 'Projects Overview'}</span>
                    </div>
                    <ArrowRightLeft className="w-3 h-3 opacity-60" />
                  </Link>

                  {/* Scoped Project Items */}
                  {jiraSubItems.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    const SubIcon = sub.icon;

                    return (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        onClick={onMobileClose}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
                          isSubActive
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-white' : 'text-slate-500'}`} />
                          <span>{sub.name}</span>
                        </div>
                        {sub.badge !== undefined && sub.badge > 0 && (
                          <span className={`w-2 h-2 rounded-full shadow-xs shrink-0 ${isSubActive ? 'bg-white' : 'bg-emerald-500'}`} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Conditional Logout */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Extensible Architecture</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Project-scoped workflow attention stream mapping tickets, quality rules, and notifications.
          </p>
        </div>

        {isLoggedIn ? (
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out of SPYROBO</span>
          </button>
        ) : (
          <Link
            href="/auth/login"
            onClick={onMobileClose}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to SPYROBO</span>
          </Link>
        )}
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        loading={loggingOut}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on small viewports) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col justify-between min-h-screen shrink-0 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay (visible on small viewports when open) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onMobileClose}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

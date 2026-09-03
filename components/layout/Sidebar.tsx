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
        { name: 'Select / Add Project', href: '/jira/projects', icon: FolderKanban },
        { name: 'All Notifications', href: '/jira/notifications', icon: Bell, badge: unreadCount },
        { name: 'Workspace Settings', href: '/jira/settings', icon: Settings },
      ];

  const isJiraActive = pathname.startsWith('/jira');
  const isHomeActive = pathname === '/';

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
    <div className="flex flex-col justify-between h-full p-4">
      <div>
        {/* Brand Logo Header with Lens Icon */}
        <div className="flex items-center justify-between px-3 py-3 mb-5 border-b border-slate-100">
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

        {/* Navigation Categories */}
        <div className="space-y-4">
          {/* Section 1: About SPYROBO Button */}
          <div>
            <Link
              href="/"
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isHomeActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Info className={`w-4 h-4 ${isHomeActive ? 'text-white' : 'text-emerald-600'}`} />
              <span>About SPYROBO</span>
            </Link>
          </div>

          {/* Section 2: JIRA Integration Category */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Integrations</span>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setJiraOpen(!jiraOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
                  isJiraActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    J
                  </div>
                  <span>Jira Cloud</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${jiraOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Active Project Selector / Switcher */}
              {jiraOpen && (
                <div className="pl-3 mt-1.5 space-y-2">
                  {currentProjectKey ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Scope</span>
                        <span className="text-xs font-black text-emerald-700 truncate block">{currentProjectKey}</span>
                      </div>
                      <Link
                        href="/jira/projects"
                        onClick={onMobileClose}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold flex items-center gap-1 transition shrink-0"
                        title="Switch Jira Project"
                      >
                        <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                        <span>Switch</span>
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/jira/projects"
                      onClick={onMobileClose}
                      className="block p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold text-center hover:bg-emerald-100 transition"
                    >
                      Select a Project →
                    </Link>
                  )}

                  {/* Nested Sub-Items */}
                  <div className="space-y-1 border-l-2 border-emerald-200 ml-2 pl-3">
                    {jiraSubItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = pathname === sub.href;

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onMobileClose}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
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
                </div>
              )}
            </div>
          </div>

          {/* Section 3: GITHUB Stream Slot */}
          <div>
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-400 font-semibold text-sm bg-slate-50 border border-slate-200/60 opacity-80 cursor-not-allowed">
              <div className="flex items-center gap-2.5">
                <GitPullRequest className="w-4 h-4 text-slate-400" />
                <span>GitHub Stream</span>
              </div>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                Soon
              </span>
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

        {/* Only render logout button if user is signed in */}
        {isLoggedIn && (
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out of SPYROBO</span>
          </button>
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

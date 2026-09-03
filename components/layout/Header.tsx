'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, UserCheck, Menu, LogIn, RefreshCw } from 'lucide-react';
import LogoutModal from './LogoutModal';
import { getCachedAuthUser, clearAuthUserCache } from '@/lib/auth/client-auth';

interface HeaderProps {
  user?: {
    displayName?: string;
    email?: string;
    jiraSite?: string;
    isVerified?: boolean;
  };
  isMockMode?: boolean;
  lastSyncAt?: string | Date;
  onSyncTrigger?: () => Promise<void>;
  onMobileMenuToggle?: () => void;
}

export default function Header({ user: initialUser, isMockMode, onSyncTrigger, onMobileMenuToggle }: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (initialUser && initialUser.email) {
      setCurrentUser(initialUser);
      setLoading(false);
      return;
    }

    setLoading(true);
    getCachedAuthUser()
      .then((data) => {
        if (data?.authenticated && data?.user && data?.user?.isVerified) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, [initialUser]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      if (onSyncTrigger) {
        await onSyncTrigger();
      } else {
        await fetch('/api/jira/sync', { method: 'POST' });
        window.location.reload();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      clearAuthUserCache();
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth/login';
    } catch (err) {
      console.error('Failed to log out:', err);
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const isLoggedIn = Boolean(currentUser && currentUser.isVerified);

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden transition"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {isMockMode && (
            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
              Demo / Mock Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Instant Sync Jira Button */}
          {isLoggedIn && (
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync Jira Cloud Statuses"
              className="px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition shrink-0 flex items-center gap-1.5 text-xs font-bold border border-emerald-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync Jira'}</span>
            </button>
          )}

          {/* User Identity & Logout - Displayed ONLY when authenticated */}
          {loading ? (
            <div className="flex items-center gap-2.5 animate-pulse">
              <div className="w-8.5 h-8.5 rounded-full bg-slate-200 shrink-0" />
              <div className="hidden md:flex flex-col gap-1">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-2.5 w-28 bg-slate-100 rounded" />
              </div>
            </div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8.5 h-8.5 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0">
                {currentUser.displayName
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : currentUser.email.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block max-w-[160px] truncate">
                <div className="flex items-center gap-1.5 truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.displayName || 'Verified User'}
                  </p>
                  <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">{currentUser.email}</p>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                title="Logout"
                className="px-2.5 py-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition shrink-0 flex items-center gap-1.5 text-xs font-bold border border-rose-200/60"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        loading={loggingOut}
      />
    </>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, LogOut, UserCheck, Menu } from 'lucide-react';
import LogoutModal from './LogoutModal';

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

export default function Header({ user, isMockMode, onMobileMenuToggle }: HeaderProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
          {/* User Identity & Auth Button */}
          {user?.email ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8.5 h-8.5 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block max-w-[160px] truncate">
                <div className="flex items-center gap-1.5 truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.displayName || 'Verified User'}</p>
                  {user.isVerified && <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate">{user.email}</p>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                title="Logout"
                className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              Sign In
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

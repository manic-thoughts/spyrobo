import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import ErrorBoundary from '@/components/ErrorBoundary';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const getAppUrl = (): URL => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cleanUrl = envUrl.replace(/^["']|["']$/g, '').trim();
  const validUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
  try {
    return new URL(validUrl);
  } catch (e) {
    return new URL('http://localhost:3000');
  }
};

export const metadata: Metadata = {
  title: {
    default: 'SPYROBO — Workflow Attention Tool',
    template: '%s | SPYROBO',
  },
  description:
    'SPYROBO is an intelligent Workflow Attention Tool over engineering tools. Monitor Jira tickets, overdue work, due dates, and ticket quality completeness in one clean dashboard.',
  keywords: [
    'Jira',
    'Workflow Attention Tool',
    'Jira Dashboard',
    'Quality Validation',
    'Engineering Intelligence',
    'Project Management',
    'SPYROBO',
  ],
  authors: [{ name: 'SPYROBO Team' }],
  metadataBase: getAppUrl(),
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'SPYROBO — Workflow Attention Tool',
    description:
      'Workflow Attention Tool over engineering tools. Monitor personal assignments, overdue items, quality completeness rules, and notifications.',
    url: 'https://spyrobo.app',
    siteName: 'SPYROBO',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SPYROBO — Workflow Attention Tool',
    description:
      'Workflow Attention Tool over engineering tools. Monitor personal assignments, overdue items, quality rules, and notifications.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={`${plusJakartaSans.className} bg-slate-50 text-slate-900 antialiased min-h-screen`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

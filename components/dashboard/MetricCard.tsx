'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  count: number;
  subtitle: string;
  icon: LucideIcon;
  variant: 'overdue' | 'due-today' | 'quality' | 'assigned';
  onClick?: () => void;
  isSelected?: boolean;
}

export default function MetricCard({
  title,
  count,
  subtitle,
  icon: Icon,
  variant,
  onClick,
  isSelected,
}: MetricCardProps) {
  const variantStyles = {
    overdue: {
      border: 'hover:border-rose-300',
      selected: 'border-rose-500 bg-rose-50/90 shadow-md shadow-rose-500/10',
      iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
      badge: 'text-rose-700',
    },
    'due-today': {
      border: 'hover:border-amber-300',
      selected: 'border-amber-500 bg-amber-50/90 shadow-md shadow-amber-500/10',
      iconBg: 'bg-amber-100 text-amber-800 border-amber-200',
      badge: 'text-amber-800',
    },
    quality: {
      border: 'hover:border-purple-300',
      selected: 'border-purple-500 bg-purple-50/90 shadow-md shadow-purple-500/10',
      iconBg: 'bg-purple-100 text-purple-700 border-purple-200',
      badge: 'text-purple-700',
    },
    assigned: {
      border: 'hover:border-emerald-300',
      selected: 'border-emerald-500 bg-emerald-50/90 shadow-md shadow-emerald-500/10',
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      badge: 'text-emerald-700',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 cursor-pointer transition-all duration-300 ${
        isSelected ? style.selected : style.border
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">{title}</span>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900 tracking-tight">{count}</span>
        <span className={`text-xs font-semibold ${style.badge}`}>{subtitle}</span>
      </div>
    </div>
  );
}

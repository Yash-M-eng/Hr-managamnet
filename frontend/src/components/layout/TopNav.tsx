'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { Bell, Search, Globe2, Shield } from 'lucide-react';

export function TopNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const getPageTitle = () => {
    if (pathname === '/') return 'Organization Salary Dashboard';
    if (pathname.startsWith('/employees')) return 'Employee Directory & Salary Records';
    if (pathname === '/analytics') return 'Global Compensation Analytics';
    if (pathname === '/ai-assistant') return 'AI Salary & Payroll Assistant';
    return 'Salary Management';
  };

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-8 text-slate-300">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">{getPageTitle()}</h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
          10,000 Employees Active
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Normalized Reporting: <strong className="text-slate-200">USD</strong></span>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40">
          <Shield className="w-3.5 h-3.5" />
          <span>Role: {user?.role || 'HR_MANAGER'}</span>
        </div>
      </div>
    </header>
  );
}

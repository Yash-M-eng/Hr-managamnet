'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { Globe2, Shield, Sparkles, Building2 } from 'lucide-react';

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
    <header className="h-16 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-8 text-slate-300">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-white tracking-tight">{getPageTitle()}</h2>
        <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          10,000 Employees Active
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
          <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Reporting Currency:</span>
          <strong className="text-white font-semibold">USD ($)</strong>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-800/40 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">{user?.role || 'HR_MANAGER'}</span>
        </div>
      </div>
    </header>
  );
}

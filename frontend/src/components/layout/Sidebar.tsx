'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Sparkles, 
  LogOut, 
  Building2,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
  { name: 'Employees', href: '/employees', icon: Users, badge: '10k' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, badge: null },
  { name: 'AI Salary Assistant', href: '/ai-assistant', icon: Sparkles, badge: 'Gemini' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  if (pathname === '/login') return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between h-screen fixed left-0 top-0 z-40 text-slate-300">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3.5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white tracking-tight text-base">ACME Corp</h1>
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-mono font-medium border border-indigo-500/30">
                SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Salary & People Ops</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Management</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <span className="text-[13px]">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-200" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile and logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20 shadow-sm">
            {user?.name ? user.name[0] : 'A'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Alice Montgomery'}</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span className="truncate">{user?.role || 'HR_MANAGER'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

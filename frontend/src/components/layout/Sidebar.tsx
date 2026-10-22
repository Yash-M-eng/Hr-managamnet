'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Home,
  Users, 
  BarChart2, 
  Sparkles, 
  LogOut, 
  ChevronRight
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'AI Salary Assistant', href: '/ai-assistant', icon: Sparkles },
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
    <aside className="w-64 bg-[#0a152d] border-r border-[#152549] flex flex-col justify-between h-screen fixed left-0 top-0 z-40 text-slate-300 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 gap-3.5">
          {/* Stylized Logo 'A' icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 22 22 22" fill="currentColor" fillOpacity="0.2"/>
              <line x1="5" y1="16" x2="19" y2="16"/>
              <path d="M12 2L2 22"/>
              <path d="M12 2L22 22"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-base leading-tight">ACME Corp</h1>
            <p className="text-xs text-blue-300/80 font-normal">Salary & People Ops</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-4 py-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1864f7] text-white shadow-lg shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/90" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile & logout at bottom */}
      <div className="p-4 border-t border-[#152549] bg-[#081023]/60">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#1864f7] flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.name ? user.name[0] : 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Alice Montgomery'}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{user?.role || 'HR_MANAGER'}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/5 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

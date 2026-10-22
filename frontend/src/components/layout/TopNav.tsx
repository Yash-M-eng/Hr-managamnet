'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency-context';
import { usePathname } from 'next/navigation';
import { Users, DollarSign, ChevronDown, Check } from 'lucide-react';

export function TopNav() {
  const { user } = useAuth();
  const { reportingCurrency, setReportingCurrencyCode } = useCurrency();
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname === '/login') return null;

  // Derive page title & breadcrumbs
  const getPageInfo = () => {
    if (pathname === '/') return { section: 'Overview', title: 'Dashboard' };
    if (pathname.startsWith('/employees/')) return { section: 'Directory', title: 'Employee Profile' };
    if (pathname.startsWith('/employees')) return { section: 'Directory', title: 'Employee Directory' };
    if (pathname.startsWith('/analytics')) return { section: 'Intelligence', title: 'Analytics & Benchmarks' };
    if (pathname.startsWith('/ai-assistant')) return { section: 'Copilot', title: 'AI Salary Assistant' };
    return { section: 'Enterprise', title: 'Overview' };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-7 shadow-xs">
      {/* Left: Section & Page Title Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>{pageInfo.section}</span>
          <span>/</span>
        </div>
        <h1 className="text-sm font-bold text-slate-800 tracking-tight">
          {pageInfo.title}
        </h1>
      </div>

      {/* Right status badges with refined enterprise styling */}
      <div className="flex items-center gap-3">
        {/* 10,000 Employees Active with pulse indicator */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-50/70 text-[#1d4ed8] border border-blue-200/70 text-xs font-medium shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563eb]"></span>
          </span>
          <Users className="w-3.5 h-3.5 text-[#2563eb]" />
          <span className="font-semibold text-slate-700">10,000 <span className="font-normal text-slate-500">Employees Active</span></span>
        </div>

        {/* Interactive Reporting Currency Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-xs hover:border-[#1864f7] hover:bg-blue-50/20 transition-all cursor-pointer focus:outline-none"
            title="Change Global Reporting Currency"
          >
            <div className="w-5 h-5 rounded-md bg-[#1864f7] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
              {reportingCurrency.symbol}
            </div>
            <div className="text-left leading-tight pr-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Reporting</span>
              <span className="font-bold text-slate-800 text-[11px]">{reportingCurrency.code}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
          </button>

          {isCurrencyOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Reporting Currency</p>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-0.5 px-1.5">
                {SUPPORTED_CURRENCIES.map((curr) => {
                  const isSelected = reportingCurrency.code === curr.code;
                  return (
                    <button
                      key={curr.code}
                      onClick={() => {
                        setReportingCurrencyCode(curr.code);
                        setIsCurrencyOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50/80 text-[#1864f7] font-bold' 
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold ${
                          isSelected ? 'bg-[#1864f7] text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {curr.symbol}
                        </span>
                        <div className="text-left">
                          <span className="block leading-tight">{curr.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {curr.code} {curr.code !== 'USD' && `(1 = $${curr.rateToUSD})`}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#1864f7]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Role: HR_MANAGER */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-slate-500 font-normal">Role:</span>
          <span className="font-bold text-emerald-900">{user?.role || 'HR_MANAGER'}</span>
        </div>
      </div>
    </header>
  );
}

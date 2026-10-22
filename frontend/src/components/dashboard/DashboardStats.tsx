'use client';

import React from 'react';
import { Users, TrendingUp, Award } from 'lucide-react';

interface DashboardStatsProps {
  overview: any;
  reportingCurrency: { code: string; symbol: string };
  formatReportingAmount: (amount: number) => string;
}

export function DashboardStats({
  overview,
  reportingCurrency,
  formatReportingAmount,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Active Headcount Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Headcount</span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1864f7] border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
            {overview?.totalActiveEmployees?.toLocaleString()}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Across 6 Countries & 8 Depts</span>
          </div>
        </div>
      </div>

      {/* Total Annual Base Payroll Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annual Base Payroll ({reportingCurrency.code})</span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="font-bold text-xs">{reportingCurrency.symbol}</span>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
            {formatReportingAmount(overview?.totalAnnualBaseSalaryUSD || 0)}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">
            Total Comp: <strong className="text-slate-800">{formatReportingAmount(overview?.totalAnnualCompensationUSD || 0)}</strong>
          </p>
        </div>
      </div>

      {/* Average Base Pay Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Base Pay ({reportingCurrency.code})</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            {formatReportingAmount(overview?.averageAnnualBaseSalaryUSD || 0)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
            <span>Median: <strong className="text-slate-800">{formatReportingAmount(overview?.medianAnnualBaseSalaryUSD || 0)}</strong></span>
          </div>
        </div>
      </div>

      {/* Compensation Range Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Salary Range</span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-extrabold text-[#0f172a] tracking-tight truncate">
            {formatReportingAmount(overview?.minAnnualBaseSalaryUSD || 0)} – {formatReportingAmount(overview?.maxAnnualBaseSalaryUSD || 0)}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5">Min to Max Active Base in {reportingCurrency.code}</p>
        </div>
      </div>
    </div>
  );
}

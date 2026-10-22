'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface CountryBenchmarkTableProps {
  countries: any[];
  reportingCurrency: { code: string };
  formatReportingAmount: (amount: number) => string;
}

export function CountryBenchmarkTable({
  countries,
  reportingCurrency,
  formatReportingAmount,
}: CountryBenchmarkTableProps) {
  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a] tracking-tight">Multinational Headcount & Payroll Benchmark</h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregated using official database reference exchange rates</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-[#1864f7]" />
          <span>6 Global Jurisdictions</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Country</th>
              <th className="px-5 py-3.5">Local Currency</th>
              <th className="px-5 py-3.5">Exchange Rate (to USD)</th>
              <th className="px-5 py-3.5">Active Headcount</th>
              <th className="px-5 py-3.5">Average Base ({reportingCurrency.code})</th>
              <th className="px-5 py-3.5">Total Payroll ({reportingCurrency.code})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {countries.map((c) => (
              <tr key={c.countryCode} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 text-[#0f172a] flex items-center gap-2.5 font-bold">
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-[#1864f7] rounded-md border border-blue-200 font-bold">
                    {c.countryCode}
                  </span>
                  <span>{c.countryName}</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-[#1864f7] font-bold">{c.currency}</td>
                <td className="px-5 py-3.5 font-mono text-slate-500">{c.exchangeRate}</td>
                <td className="px-5 py-3.5 text-[#0f172a] font-bold">{c.employeeCount.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-emerald-600 font-bold">{formatReportingAmount(c.avgSalaryUSD)}</td>
                <td className="px-5 py-3.5 text-slate-900 font-bold">{formatReportingAmount(c.totalSalaryUSD)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

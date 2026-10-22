'use client';

import React from 'react';
import { formatCurrency } from '@/lib/api';
import { History } from 'lucide-react';

interface SalaryHistoryTimelineProps {
  salaries: any[];
}

export function SalaryHistoryTimeline({ salaries }: SalaryHistoryTimelineProps) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-[#0f172a]">Historical Compensation Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">Timeline of all active and superseded compensation iterations</p>
        </div>
        <History className="w-5 h-5 text-blue-600" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Effective Period</th>
              <th className="px-4 py-3">Base Salary</th>
              <th className="px-4 py-3">Variable Bonus</th>
              <th className="px-4 py-3">Normalized USD</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {salaries?.map((sal: any) => (
              <tr key={sal.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {new Date(sal.effectiveFrom).toLocaleDateString()}
                  {sal.effectiveTo && (
                    <span className="text-slate-400"> → {new Date(sal.effectiveTo).toLocaleDateString()}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">
                  {formatCurrency(sal.baseSalary, sal.currency)}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatCurrency(sal.variableBonus, sal.currency)}
                </td>
                <td className="px-4 py-3 font-bold text-emerald-600">
                  {formatCurrency(sal.normalizedUSD)}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                    {sal.changeReason || 'INITIAL'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {sal.isCurrent ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                      Active Current
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                      Historical
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

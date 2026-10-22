'use client';

import React from 'react';
import { formatCurrency } from '@/lib/api';
import { ShieldCheck } from 'lucide-react';

interface SalaryAuditTrailProps {
  auditLogs: any[];
}

export function SalaryAuditTrail({ auditLogs }: SalaryAuditTrailProps) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-[#0f172a]">Salary Change Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">Audited by actor, timestamp, delta, and rationale</p>
        </div>
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
      </div>

      {auditLogs?.length === 0 ? (
        <p className="text-xs text-slate-400 py-4">No audit logs recorded for this employee yet.</p>
      ) : (
        <div className="space-y-3">
          {auditLogs?.map((log: any) => (
            <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {log.changeReason}: {formatCurrency(log.newBaseSalary, log.currency)}
                  {log.previousBaseSalary && (
                    <span className="text-slate-500 font-normal"> (prev: {formatCurrency(log.previousBaseSalary, log.currency)})</span>
                  )}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(log.changedAt).toLocaleString()}
                </span>
              </div>
              {log.notes && <p className="text-slate-600 mt-1 italic">&ldquo;{log.notes}&rdquo;</p>}
              <p className="text-[11px] text-blue-600 mt-1.5 font-semibold">
                Logged by: {log.changedBy?.name} ({log.changedBy?.email})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

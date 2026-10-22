'use client';

import React from 'react';

interface SalaryUpdateModalProps {
  show: boolean;
  onClose: () => void;
  currency: string;
  baseSalary: number;
  setBaseSalary: (val: number) => void;
  variableBonus: number;
  setVariableBonus: (val: number) => void;
  effectiveFrom: string;
  setEffectiveFrom: (val: string) => void;
  changeReason: string;
  setChangeReason: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function SalaryUpdateModal({
  show,
  onClose,
  currency,
  baseSalary,
  setBaseSalary,
  variableBonus,
  setVariableBonus,
  effectiveFrom,
  setEffectiveFrom,
  changeReason,
  setChangeReason,
  notes,
  setNotes,
  submitting,
  submitError,
  onSubmit,
}: SalaryUpdateModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
        <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight mb-1">
          Revise Employee Salary
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          This action atomically updates current compensation, archives historical records, and creates an audit entry.
        </p>

        {submitError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {submitError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                New Base Salary ({currency})
              </label>
              <input
                type="number"
                required
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Variable Bonus ({currency})
              </label>
              <input
                type="number"
                value={variableBonus}
                onChange={(e) => setVariableBonus(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Effective Start Date
              </label>
              <input
                type="date"
                required
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Reason for Change
              </label>
              <select
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="PROMOTION">Promotion</option>
                <option value="ANNUAL_REVIEW">Annual Merit Review</option>
                <option value="MARKET_ADJUSTMENT">Market Calibration</option>
                <option value="COST_OF_LIVING">Cost of Living Adjustment</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Audit Notes / Justification
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Exceptional performance during Q3 and leadership expansion"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#1864f7] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Applying Change...' : 'Confirm Salary Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

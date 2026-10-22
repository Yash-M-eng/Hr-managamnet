'use client';

import React from 'react';
import { UserX, UserCheck, AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EmployeeStatusModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeName: string;
  employeeCode: string;
  currentStatus: string;
  targetStatus: string;
  loading: boolean;
  error: string | null;
}

export function EmployeeStatusModal({
  show,
  onClose,
  onConfirm,
  employeeName,
  employeeCode,
  currentStatus,
  targetStatus,
  loading,
  error,
}: EmployeeStatusModalProps) {
  if (!show) return null;

  const isDeactivating = targetStatus === 'INACTIVE';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header & Icon */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDeactivating
                ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-sm shadow-rose-500/10'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-sm shadow-emerald-500/10'
            }`}
          >
            {isDeactivating ? (
              <UserX className="w-6 h-6" />
            ) : (
              <UserCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {isDeactivating ? 'Deactivate Employee Record?' : 'Reactivate Employee Record?'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm status change for <span className="font-semibold text-slate-700">{employeeName}</span> ({employeeCode}) from <span className="font-semibold text-slate-600">{currentStatus}</span> to <span className={`font-semibold ${isDeactivating ? 'text-rose-600' : 'text-emerald-600'}`}>{targetStatus}</span>
            </p>
          </div>
        </div>

        {/* Error Alert Box (replaces browser alert) */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Action Failed:</span> {error}
            </div>
          </div>
        )}

        {/* Impact Information Cards */}
        {isDeactivating ? (
          <div className="space-y-2.5 mb-6 text-xs bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-slate-600">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Excluded from Active Payroll:</span>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  The employee will be flagged as <span className="font-semibold text-rose-600">INACTIVE</span> and excluded from active headcount metrics and routine salary calibration runs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Historical Integrity Preserved:</span>
                <p className="text-slate-500 mt-0.5 leading-relaxed">
                  All past salary revisions, audit logs, and employee details remain safely preserved in the database.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-xs bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-4 text-slate-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-900">Restoring Active Status:</span>
                <p className="text-emerald-700/90 mt-0.5 leading-relaxed">
                  This employee will be returned to <span className="font-bold text-emerald-700">ACTIVE</span> status and included in all salary dashboards, filters, and reports.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
              isDeactivating
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : isDeactivating ? (
              <>
                <UserX className="w-3.5 h-3.5" />
                <span>Yes, Deactivate Employee</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Yes, Reactivate Employee</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

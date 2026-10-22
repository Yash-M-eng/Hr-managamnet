'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, formatCurrency } from '@/lib/api';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  History, 
  PlusCircle, 
  ShieldCheck, 
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';

export default function EmployeeDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Salary revision modal state
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [variableBonus, setVariableBonus] = useState<number>(0);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [changeReason, setChangeReason] = useState('ANNUAL_REVIEW');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/employees/${id}`);
      setEmployee(res.data);
      const current = res.data.salaries?.find((s: any) => s.isCurrent);
      if (current) {
        setBaseSalary(current.baseSalary);
        setVariableBonus(current.variableBonus);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchEmployee();
    }
  }, [user, id]);

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/employees/${id}/salaries`, {
        baseSalary: Number(baseSalary),
        variableBonus: Number(variableBonus),
        currency: employee.country.currency,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        changeReason,
        notes,
      });

      setShowSalaryModal(false);
      fetchEmployee();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to record salary update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async () => {
    const nextStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`Are you sure you want to transition this employee to ${nextStatus}?`)) return;

    try {
      await api.patch(`/employees/${id}/status`, { status: nextStatus });
      fetchEmployee();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading employee profile & history...</div>;
  }

  if (error || !employee) {
    return (
      <div className="p-6 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl">
        <p className="font-semibold">{error || 'Employee record not found'}</p>
        <button onClick={() => router.push('/employees')} className="mt-3 text-xs underline">
          Return to Employee Directory
        </button>
      </div>
    );
  }

  const currentSalary = employee.salaries?.find((s: any) => s.isCurrent) || employee.salaries?.[0];

  return (
    <div className="h-full overflow-y-auto space-y-6 pb-12 pr-1">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.push('/employees')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employee Directory</span>
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {employee.firstName} {employee.lastName}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                employee.status === 'ACTIVE'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                  : employee.status === 'ON_LEAVE'
                  ? 'bg-amber-950/60 text-amber-400 border-amber-800/50'
                  : 'bg-rose-950/60 text-rose-400 border-rose-800/50'
              }`}
            >
              {employee.status}
            </span>
          </div>

          <p className="text-sm text-indigo-400 font-medium mt-1">{employee.jobTitle}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3">
            <span className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              ID: {employee.employeeCode}
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              {employee.department?.name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {employee.country?.name} ({employee.country?.currency})
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Hired: {new Date(employee.hireDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSalaryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Revise Salary</span>
          </button>
          <button
            onClick={handleStatusToggle}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              employee.status === 'ACTIVE'
                ? 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/50'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50'
            }`}
          >
            {employee.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            <span>{employee.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</span>
          </button>
        </div>
      </div>

      {/* Compensation Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Base Salary</span>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-white">
              {currentSalary ? formatCurrency(currentSalary.baseSalary, currentSalary.currency) : 'N/A'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Paid in local currency ({employee.country?.currency})</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Normalized Base (USD)</span>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-emerald-400">
              {currentSalary ? formatCurrency(currentSalary.normalizedUSD) : 'N/A'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Exchange rate: {employee.country?.exchangeRate}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Variable Bonus & Total Comp</span>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-indigo-400">
              {currentSalary ? formatCurrency(currentSalary.totalNormalizedUSD) : 'N/A'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bonus: {currentSalary ? formatCurrency(currentSalary.variableBonus, currentSalary.currency) : '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Salary History Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Compensation History Timeline</h2>
            <p className="text-xs text-slate-400 mt-0.5">Immutable records of historical salary adjustments</p>
          </div>
          <History className="w-4 h-4 text-indigo-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Effective Date</th>
                <th className="px-4 py-3">Base Salary</th>
                <th className="px-4 py-3">Variable Bonus</th>
                <th className="px-4 py-3">Normalized USD</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {employee.salaries?.map((sal: any) => (
                <tr key={sal.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-white">
                    {new Date(sal.effectiveFrom).toLocaleDateString()}
                    {sal.effectiveTo && (
                      <span className="text-slate-500"> → {new Date(sal.effectiveTo).toLocaleDateString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    {formatCurrency(sal.baseSalary, sal.currency)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatCurrency(sal.variableBonus, sal.currency)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">
                    {formatCurrency(sal.normalizedUSD)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium border border-slate-700">
                      {sal.changeReason || 'INITIAL'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {sal.isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold text-[10px]">
                        Active Current
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
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

      {/* Audit Log Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Salary Change Audit Trail</h2>
            <p className="text-xs text-slate-400 mt-0.5">Audited by actor, timestamp, delta, and rationale</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>

        {employee.auditLogs?.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No audit logs recorded for this employee yet.</p>
        ) : (
          <div className="space-y-3">
            {employee.auditLogs?.map((log: any) => (
              <div key={log.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    {log.changeReason}: {formatCurrency(log.newBaseSalary, log.currency)}
                    {log.previousBaseSalary && (
                      <span className="text-slate-400 font-normal"> (prev: {formatCurrency(log.previousBaseSalary, log.currency)})</span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(log.changedAt).toLocaleString()}
                  </span>
                </div>
                {log.notes && <p className="text-slate-400 mt-1 italic">&ldquo;{log.notes}&rdquo;</p>}
                <p className="text-[11px] text-indigo-400 mt-1.5 font-medium">
                  Logged by: {log.changedBy?.name} ({log.changedBy?.email})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary Revision Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white tracking-tight mb-1">
              Revise Employee Salary
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              This action atomically updates the current compensation, archives historical records, and creates an audit entry.
            </p>

            {submitError && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSalarySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    New Base Salary ({employee.country?.currency})
                  </label>
                  <input
                    type="number"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Variable Bonus ({employee.country?.currency})
                  </label>
                  <input
                    type="number"
                    value={variableBonus}
                    onChange={(e) => setVariableBonus(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Effective Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Reason for Change
                  </label>
                  <select
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="PROMOTION">Promotion</option>
                    <option value="ANNUAL_REVIEW">Annual Merit Review</option>
                    <option value="MARKET_ADJUSTMENT">Market Calibration</option>
                    <option value="COST_OF_LIVING">Cost of Living Adjustment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Audit Notes / Justification
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Exceptional performance during Q3 and leadership expansion"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Applying Change...' : 'Confirm Salary Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

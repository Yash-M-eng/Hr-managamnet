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
  PlusCircle, 
  UserCheck,
  UserX
} from 'lucide-react';
import { SalaryHistoryTimeline } from '@/components/salary/SalaryHistoryTimeline';
import { SalaryAuditTrail } from '@/components/salary/SalaryAuditTrail';
import { SalaryUpdateModal } from '@/components/salary/SalaryUpdateModal';
import { EmployeeStatusModal } from '@/components/employees/EmployeeStatusModal';

export default function EmployeeDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition modal state (custom UI replacing browser alert/confirm)
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

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

  const handleOpenStatusModal = () => {
    setStatusError(null);
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!employee) return;
    const nextStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusLoading(true);
    setStatusError(null);

    try {
      await api.patch(`/employees/${id}/status`, { status: nextStatus });
      setShowStatusModal(false);
      fetchEmployee();
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'Failed to update employee status');
    } finally {
      setStatusLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading employee profile & history...</div>;
  }

  if (error || !employee) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl">
        <p className="font-semibold">{error || 'Employee record not found'}</p>
        <button onClick={() => router.push('/employees')} className="mt-3 text-xs underline cursor-pointer">
          Return to Employee Directory
        </button>
      </div>
    );
  }

  const currentSalary = employee.salaries?.find((s: any) => s.isCurrent) || employee.salaries?.[0];

  return (
    <div className="flex-1 min-h-0 h-full overflow-y-auto space-y-6 pb-12 pr-1 w-full select-text">
      {/* Top Navigation */}
      <button
        onClick={() => router.push('/employees')}
        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Employee Directory</span>
      </button>

      {/* Header Profile Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">{employee.fullName}</h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                employee.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : employee.status === 'ON_LEAVE'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {employee.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-500">
            <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {employee.employeeCode}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {employee.department.name} ({employee.jobTitle})
            </span>
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {employee.country.name} ({employee.country.code})
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Hired {new Date(employee.hireDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleOpenStatusModal}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              employee.status === 'ACTIVE'
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
            }`}
          >
            {employee.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            <span>{employee.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</span>
          </button>
          <button
            onClick={() => {
              setEffectiveFrom(new Date().toISOString().split('T')[0]);
              setShowSalaryModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Update Salary</span>
          </button>
        </div>
      </div>

      {/* Current Compensation Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Current Base Salary
          </span>
          <div className="text-2xl font-black text-slate-900">
            {currentSalary ? formatCurrency(currentSalary.baseSalary, currentSalary.currency) : 'N/A'}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Local Currency ({employee.country.currency})</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Variable Bonus Target
          </span>
          <div className="text-2xl font-black text-slate-900">
            {currentSalary ? formatCurrency(currentSalary.variableBonus, currentSalary.currency) : 'N/A'}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Annual Performance Incentive</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Normalized USD Comp
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {currentSalary ? formatCurrency(currentSalary.totalNormalizedUSD) : 'N/A'}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Base + Variable at Fixed Ref Rates</span>
        </div>
      </div>

      {/* Historical Salary Timeline Table */}
      <SalaryHistoryTimeline salaries={employee.salaries} />

      {/* Audit Log Timeline */}
      <SalaryAuditTrail auditLogs={employee.auditLogs} />

      {/* Salary Revision Modal */}
      <SalaryUpdateModal
        show={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        currency={employee.country?.currency}
        baseSalary={baseSalary}
        setBaseSalary={setBaseSalary}
        variableBonus={variableBonus}
        setVariableBonus={setVariableBonus}
        effectiveFrom={effectiveFrom}
        setEffectiveFrom={setEffectiveFrom}
        changeReason={changeReason}
        setChangeReason={setChangeReason}
        notes={notes}
        setNotes={setNotes}
        submitting={submitting}
        submitError={submitError}
        onSubmit={handleSalarySubmit}
      />

      {/* Custom Employee Status Transition Modal (Replaces native browser confirm/alert) */}
      <EmployeeStatusModal
        show={showStatusModal}
        onClose={() => {
          if (!statusLoading) setShowStatusModal(false);
        }}
        onConfirm={handleConfirmStatusChange}
        employeeName={employee.fullName}
        employeeCode={employee.employeeCode}
        currentStatus={employee.status}
        targetStatus={employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}
        loading={statusLoading}
        error={statusError}
      />
    </div>
  );
}

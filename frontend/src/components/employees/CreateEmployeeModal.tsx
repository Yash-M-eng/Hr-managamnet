'use client';

import React from 'react';

interface CreateEmployeeModalProps {
  show: boolean;
  onClose: () => void;
  newEmp: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    departmentId: string;
    countryId: string;
    hireDate: string;
    initialBaseSalary: number;
    initialBonus: number;
    currency: string;
  };
  setNewEmp: (val: any) => void;
  departments: Array<{ id: string; name: string }>;
  countries: Array<{ id: string; name: string; currency: string }>;
  createLoading: boolean;
  createError: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateEmployeeModal({
  show,
  onClose,
  newEmp,
  setNewEmp,
  departments,
  countries,
  createLoading,
  createError,
  onSubmit,
}: CreateEmployeeModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
        <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight mb-1">
          Add New Employee Profile
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Enter employee details and initial baseline salary record
        </p>

        {createError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {createError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Employee Code
              </label>
              <input
                type="text"
                required
                value={newEmp.employeeCode}
                onChange={(e) => setNewEmp({ ...newEmp, employeeCode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={newEmp.email}
                onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={newEmp.firstName}
                onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={newEmp.lastName}
                onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Job Title
              </label>
              <input
                type="text"
                required
                value={newEmp.jobTitle}
                onChange={(e) => setNewEmp({ ...newEmp, jobTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={newEmp.departmentId}
                onChange={(e) => setNewEmp({ ...newEmp, departmentId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Country
              </label>
              <select
                value={newEmp.countryId}
                onChange={(e) => {
                  const sel = countries.find((c) => c.id === e.target.value);
                  setNewEmp({
                    ...newEmp,
                    countryId: e.target.value,
                    currency: sel ? sel.currency : 'USD',
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Hire Date
              </label>
              <input
                type="date"
                required
                value={newEmp.hireDate}
                onChange={(e) => setNewEmp({ ...newEmp, hireDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Base Salary ({newEmp.currency})
              </label>
              <input
                type="number"
                required
                value={newEmp.initialBaseSalary}
                onChange={(e) => setNewEmp({ ...newEmp, initialBaseSalary: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Variable Bonus ({newEmp.currency})
              </label>
              <input
                type="number"
                value={newEmp.initialBonus}
                onChange={(e) => setNewEmp({ ...newEmp, initialBonus: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-5 py-2 bg-[#1864f7] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
            >
              {createLoading ? 'Saving...' : 'Create Employee Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

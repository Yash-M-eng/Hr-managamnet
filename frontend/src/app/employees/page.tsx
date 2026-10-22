'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, formatCurrency } from '@/lib/api';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  ArrowUpDown,
  Building,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function EmployeesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [departments, setDepartments] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  // Filters & State
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('employeeCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // New Employee Modal state
  const [showModal, setShowModal] = useState(false);
  const [newEmp, setNewEmp] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    departmentId: '',
    countryId: '',
    hireDate: '',
    initialBaseSalary: 95000,
    initialBonus: 10000,
    currency: 'USD',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load departments and countries for filter dropdowns
  useEffect(() => {
    if (user) {
      api.get('/departments').then((res) => setDepartments(res.data)).catch(() => {});
      api.get('/countries').then((res) => setCountries(res.data)).catch(() => {});
    }
  }, [user]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees', {
        params: {
          page,
          limit: 25,
          search: search || undefined,
          departmentId: departmentId || undefined,
          countryId: countryId || undefined,
          status: status || undefined,
          sortBy,
          sortOrder,
        },
      });
      setEmployees(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchEmployees();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [user, search, departmentId, countryId, status, sortBy, sortOrder, page]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      // 1. Create employee
      const empRes = await api.post('/employees', {
        employeeCode: newEmp.employeeCode,
        firstName: newEmp.firstName,
        lastName: newEmp.lastName,
        email: newEmp.email,
        jobTitle: newEmp.jobTitle,
        departmentId: newEmp.departmentId,
        countryId: newEmp.countryId,
        hireDate: new Date(newEmp.hireDate).toISOString(),
        status: 'ACTIVE',
      });

      // 2. Attach initial salary record
      await api.post(`/employees/${empRes.data.id}/salaries`, {
        baseSalary: Number(newEmp.initialBaseSalary),
        variableBonus: Number(newEmp.initialBonus),
        currency: newEmp.currency,
        effectiveFrom: new Date(newEmp.hireDate).toISOString(),
        changeReason: 'INITIAL_HIRE',
        notes: 'Initial hire compensation',
      });

      setShowModal(false);
      fetchEmployees();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create employee profile.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Employee Directory</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage profile details, salary tiers, and historical compensation records ({meta.total.toLocaleString()} total)
          </p>
        </div>
        <button
          onClick={() => {
            setNewEmp({
              employeeCode: `ACM-${Math.floor(10000 + Math.random() * 90000)}`,
              firstName: '',
              lastName: '',
              email: '',
              jobTitle: '',
              departmentId: departments[0]?.id || '',
              countryId: countries[0]?.id || '',
              hireDate: new Date().toISOString().split('T')[0],
              initialBaseSalary: 95000,
              initialBonus: 8000,
              currency: countries[0]?.currency || 'USD',
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee Profile</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, or employee code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Department Filter */}
        <select
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Country Filter */}
        <select
          value={countryId}
          onChange={(e) => {
            setCountryId(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.currency})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th
                  onClick={() => handleSort('employeeCode')}
                  className="px-5 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Code</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('firstName')}
                  className="px-5 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Country</th>
                <th className="px-5 py-3.5">Current Base Salary</th>
                <th className="px-5 py-3.5">Normalized USD</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Loading records from database...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No employee records match the selected filters.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-indigo-400 font-medium">
                      {emp.employeeCode}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{emp.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{emp.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-200">{emp.department?.name}</div>
                      <div className="text-[11px] text-slate-500">{emp.jobTitle}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px] border border-slate-700">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {emp.country?.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-200">
                      {emp.currentSalary
                        ? formatCurrency(emp.currentSalary.baseSalary, emp.currentSalary.currency)
                        : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-400">
                      {emp.currentSalary ? formatCurrency(emp.currentSalary.normalizedUSD) : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                            : emp.status === 'ON_LEAVE'
                            ? 'bg-amber-950/60 text-amber-400 border-amber-800/50'
                            : 'bg-rose-950/60 text-rose-400 border-rose-800/50'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg text-[11px] font-medium text-slate-300 border border-slate-700 transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{(meta.page - 1) * meta.limit + 1}</strong> to{' '}
            <strong className="text-white">
              {Math.min(meta.page * meta.limit, meta.total)}
            </strong>{' '}
            of <strong className="text-white">{meta.total.toLocaleString()}</strong> employees
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white tracking-tight mb-1">
              Add New Employee Profile
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter employee details and initial baseline salary record
            </p>

            {createError && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmp.employeeCode}
                    onChange={(e) => setNewEmp({ ...newEmp, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmp.firstName}
                    onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmp.lastName}
                    onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmp.jobTitle}
                    onChange={(e) => setNewEmp({ ...newEmp, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={newEmp.departmentId}
                    onChange={(e) => setNewEmp({ ...newEmp, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
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
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Hire Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEmp.hireDate}
                    onChange={(e) => setNewEmp({ ...newEmp, hireDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Base Salary ({newEmp.currency})
                  </label>
                  <input
                    type="number"
                    required
                    value={newEmp.initialBaseSalary}
                    onChange={(e) => setNewEmp({ ...newEmp, initialBaseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Variable Bonus ({newEmp.currency})
                  </label>
                  <input
                    type="number"
                    value={newEmp.initialBonus}
                    onChange={(e) => setNewEmp({ ...newEmp, initialBonus: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {createLoading ? 'Saving...' : 'Create Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

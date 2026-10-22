'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, formatCurrency } from '@/lib/api';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,
  ChevronsRight,
  Plus, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Sparkles,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  RotateCcw,
  SlidersHorizontal
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
  const [limit, setLimit] = useState(25);
  const [jumpPage, setJumpPage] = useState('');
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
          limit,
          search: search.trim() || undefined,
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
  }, [user, search, departmentId, countryId, status, sortBy, sortOrder, page, limit]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartmentId('');
    setCountryId('');
    setStatus('');
    setSortBy('employeeCode');
    setSortOrder('asc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || departmentId || countryId || status || sortBy !== 'employeeCode' || sortOrder !== 'asc'
  );

  const getPaginationPages = (currentPage: number, totalPages: number) => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const renderSortIcon = (field: string) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-[#1864f7]" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-[#1864f7]" />
      );
    }
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
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
        hireDate: newEmp.hireDate ? new Date(newEmp.hireDate).toISOString() : new Date().toISOString(),
        status: 'ACTIVE',
      });

      // 2. Attach initial salary record
      await api.post(`/employees/${empRes.data.id}/salaries`, {
        baseSalary: Number(newEmp.initialBaseSalary),
        variableBonus: Number(newEmp.initialBonus),
        currency: newEmp.currency,
        effectiveFrom: newEmp.hireDate ? new Date(newEmp.hireDate).toISOString() : new Date().toISOString(),
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
    <div className="flex flex-col h-full max-h-full overflow-hidden space-y-2.5 min-h-0">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-[#0f172a] tracking-tight">
              Employee Directory
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
              <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>{meta.total.toLocaleString()} Profiles</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse and manage profiles, salary tiers, and historical compensation records across ACME global offices.
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
              hireDate: '',
              initialBaseSalary: 95000,
              initialBonus: 8000,
              currency: countries[0]?.currency || 'USD',
            });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1864f7] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee Profile</span>
        </button>
      </div>

      {/* Filter & Search Bar - Fully Dynamic */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Search with Clear Icon */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by full name, code, email, designation..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <select
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
        >
          <option value="">All Departments ({departments.length})</option>
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
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
        >
          <option value="">All Countries ({countries.length})</option>
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
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Page Size Selector */}
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
          title="Profiles per page"
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
            title="Reset all filters to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Table Section - Clean White Container with Fixed Header, Scrollable Body, Fixed Pagination */}
      <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[11px] font-bold sticky top-0 z-10 shadow-xs">
              <tr>
                <th
                  onClick={() => handleSort('employeeCode')}
                  className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors bg-[#f8fafc] select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Code</span>
                    {renderSortIcon('employeeCode')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('firstName')}
                  className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors bg-[#f8fafc] select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    {renderSortIcon('firstName')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('department')}
                  className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors bg-[#f8fafc] select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Department</span>
                    {renderSortIcon('department')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('country')}
                  className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors bg-[#f8fafc] select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Country</span>
                    {renderSortIcon('country')}
                  </div>
                </th>
                <th className="px-6 py-4 font-bold bg-[#f8fafc]">Current Base Salary</th>
                <th className="px-6 py-4 font-bold bg-[#f8fafc]">Normalized USD</th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors bg-[#f8fafc] select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-4 font-bold text-right bg-[#f8fafc]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-slate-600">Loading dynamic employee records...</span>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <span className="text-sm font-bold text-slate-700">No matching employees found</span>
                      <p className="text-xs text-slate-400">Try adjusting your search terms or clearing active filters.</p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-4 py-1.5 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-2.5 font-mono text-[#1864f7] font-semibold">
                      {emp.employeeCode}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="font-bold text-[#0f172a] text-[13px]">{emp.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{emp.email}</div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="text-slate-800 font-medium">{emp.department?.name}</div>
                      <div className="text-[11px] text-slate-400">{emp.jobTitle}</div>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                        <MapPin className="w-3 h-3 text-[#1864f7]" />
                        {emp.country?.name} ({emp.country?.code})
                      </span>
                    </td>
                    <td className="px-5 py-2.5 font-semibold text-slate-800">
                      {emp.currentSalary
                        ? formatCurrency(emp.currentSalary.baseSalary, emp.currentSalary.currency)
                        : 'N/A'}
                    </td>
                    <td className="px-5 py-2.5 font-bold text-emerald-600">
                      {emp.currentSalary ? formatCurrency(emp.currentSalary.normalizedUSD) : 'N/A'}
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          emp.status === 'ACTIVE'
                            ? 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]'
                            : emp.status === 'ON_LEAVE'
                            ? 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'
                            : 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          emp.status === 'ACTIVE' ? 'bg-[#10b981]' : emp.status === 'ON_LEAVE' ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                        }`}></span>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#f1f6ff] hover:bg-[#1864f7] text-[#1864f7] hover:text-white rounded-xl text-xs font-bold border border-[#dbeafe] transition-all"
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

        {/* Server-Side Dynamic Pagination Bar - Fixed at Bottom */}
        <div className="p-3 sm:p-3.5 bg-[#f8fafc] border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#eff6ff] text-[#1864f7] border border-[#bfdbfe]">
              <Sparkles className="w-3.5 h-3.5 text-[#1864f7]" />
              <span>Page {meta.page} of {meta.totalPages}</span>
            </span>
            <span className="text-slate-600 font-medium hidden sm:inline">
              {meta.total === 0 ? (
                '0 employees found'
              ) : (
                <>
                  Showing <strong className="text-slate-900">{(meta.page - 1) * meta.limit + 1}</strong>–<strong className="text-slate-900">{Math.min(meta.page * meta.limit, meta.total)}</strong> of <strong className="text-slate-900">{meta.total.toLocaleString()}</strong> employees
                </>
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Direct First Page Button */}
            <button
              disabled={meta.page <= 1}
              onClick={() => setPage(1)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 border border-slate-200 transition-colors shadow-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
              title="Go to First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
              <span className="hidden sm:inline">First</span>
            </button>

            {/* Prev Page Button */}
            <button
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 border border-slate-200 transition-colors shadow-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Numbered Page Buttons with Direct Click to Last Page */}
            <div className="flex items-center gap-1">
              {getPaginationPages(meta.page, meta.totalPages).map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-bold select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => setPage(Number(p))}
                    className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      meta.page === p
                        ? 'bg-[#1864f7] text-white shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                    }`}
                    title={p === meta.totalPages ? `Last Page (${meta.totalPages})` : `Page ${p}`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            {/* Next Page Button */}
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 border border-slate-200 transition-colors shadow-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Direct Last Page Button */}
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage(meta.totalPages)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1864f7] border border-[#bfdbfe] disabled:opacity-40 disabled:hover:bg-[#eff6ff] transition-colors shadow-xs font-bold cursor-pointer disabled:cursor-not-allowed"
              title={`Jump directly to Last Page (${meta.totalPages})`}
            >
              <span>Last ({meta.totalPages})</span>
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* Quick Page Jump */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const p = parseInt(jumpPage, 10);
                if (!isNaN(p) && p >= 1 && p <= meta.totalPages) {
                  setPage(p);
                  setJumpPage('');
                }
              }}
              className="flex items-center gap-1 ml-1.5 pl-1.5 border-l border-slate-200"
            >
              <span className="text-slate-400 text-[11px] font-semibold">Go:</span>
              <input
                type="number"
                min={1}
                max={meta.totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                placeholder={`${meta.page}`}
                className="w-12 px-1.5 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 shadow-xs"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-xs"
              >
                Jump
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Create Employee Modal - Clean Light White Modal */}
      {showModal && (
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

            <form onSubmit={handleCreateEmployee} className="space-y-4">
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
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-[#1864f7] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 disabled:opacity-50"
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

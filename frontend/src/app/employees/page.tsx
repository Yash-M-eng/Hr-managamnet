'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Plus, Sparkles } from 'lucide-react';
import { EmployeeFilters } from '@/components/employees/EmployeeFilters';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { EmployeePagination } from '@/components/employees/EmployeePagination';
import { CreateEmployeeModal } from '@/components/employees/CreateEmployeeModal';

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

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
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

      {/* Filter & Search Bar */}
      <EmployeeFilters
        search={search}
        setSearch={setSearch}
        departmentId={departmentId}
        setDepartmentId={setDepartmentId}
        countryId={countryId}
        setCountryId={setCountryId}
        status={status}
        setStatus={setStatus}
        limit={limit}
        setLimit={setLimit}
        departments={departments}
        countries={countries}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        onPageReset={() => setPage(1)}
      />

      {/* Table Section */}
      <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs flex flex-col flex-1 min-h-0">
        <EmployeeTable
          employees={employees}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />

        {/* Dynamic Pagination Bar */}
        <EmployeePagination
          meta={meta}
          onPageChange={setPage}
        />
      </div>

      {/* Create Employee Modal */}
      <CreateEmployeeModal
        show={showModal}
        onClose={() => setShowModal(false)}
        newEmp={newEmp}
        setNewEmp={setNewEmp}
        departments={departments}
        countries={countries}
        createLoading={createLoading}
        createError={createError}
        onSubmit={handleCreateEmployee}
      />
    </div>
  );
}

'use client';

import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

interface EmployeeFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  departmentId: string;
  setDepartmentId: (val: string) => void;
  countryId: string;
  setCountryId: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  limit: number;
  setLimit: (val: number) => void;
  departments: Array<{ id: string; name: string }>;
  countries: Array<{ id: string; name: string; currency: string }>;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onPageReset: () => void;
}

export function EmployeeFilters({
  search,
  setSearch,
  departmentId,
  setDepartmentId,
  countryId,
  setCountryId,
  status,
  setStatus,
  limit,
  setLimit,
  departments,
  countries,
  hasActiveFilters,
  onResetFilters,
  onPageReset,
}: EmployeeFiltersProps) {
  return (
    <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5 shrink-0">
      {/* Search with Clear Icon */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onPageReset();
          }}
          placeholder="Search by full name, code, email, designation..."
          className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('');
              onPageReset();
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
          onPageReset();
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
          onPageReset();
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
          onPageReset();
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
          onPageReset();
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
          onClick={onResetFilters}
          className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
          title="Reset all filters to defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
}

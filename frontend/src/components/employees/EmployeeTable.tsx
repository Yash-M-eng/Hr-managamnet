'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/api';
import { MapPin, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface EmployeeTableProps {
  employees: any[];
  loading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function EmployeeTable({
  employees,
  loading,
  sortBy,
  sortOrder,
  onSort,
  hasActiveFilters,
  onResetFilters,
}: EmployeeTableProps) {
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

  return (
    <div className="overflow-auto flex-1 min-h-0">
      <table className="w-full text-left text-xs text-slate-600 border-collapse">
        <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider border-b border-slate-200 text-[11px] font-bold sticky top-0 z-10 shadow-xs">
          <tr>
            <th
              onClick={() => onSort('employeeCode')}
              className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors bg-[#f8fafc] select-none group"
            >
              <div className="flex items-center gap-1.5">
                <span>Code</span>
                {renderSortIcon('employeeCode')}
              </div>
            </th>
            <th
              onClick={() => onSort('firstName')}
              className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors bg-[#f8fafc] select-none group"
            >
              <div className="flex items-center gap-1.5">
                <span>Name</span>
                {renderSortIcon('firstName')}
              </div>
            </th>
            <th
              onClick={() => onSort('department')}
              className="px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors bg-[#f8fafc] select-none group"
            >
              <div className="flex items-center gap-1.5">
                <span>Department</span>
                {renderSortIcon('department')}
              </div>
            </th>
            <th
              onClick={() => onSort('country')}
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
              onClick={() => onSort('status')}
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
                      onClick={onResetFilters}
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
  );
}

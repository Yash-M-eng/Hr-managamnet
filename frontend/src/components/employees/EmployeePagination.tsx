'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface EmployeePaginationProps {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function EmployeePagination({ meta, onPageChange }: EmployeePaginationProps) {
  const [jumpPage, setJumpPage] = useState('');

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

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(jumpPage);
    if (!isNaN(target) && target >= 1 && target <= meta.totalPages) {
      onPageChange(target);
      setJumpPage('');
    }
  };

  return (
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
          onClick={() => onPageChange(1)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 border border-slate-200 transition-colors shadow-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
          title="Go to First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
          <span className="hidden sm:inline">First</span>
        </button>

        {/* Prev Page Button */}
        <button
          disabled={meta.page <= 1}
          onClick={() => onPageChange(Math.max(1, meta.page - 1))}
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
                onClick={() => onPageChange(Number(p))}
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
          onClick={() => onPageChange(Math.min(meta.totalPages, meta.page + 1))}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 border border-slate-200 transition-colors shadow-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
          title="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Direct Last Page Button */}
        <button
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.totalPages)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 border border-slate-200 transition-colors shadow-xs font-semibold cursor-pointer disabled:cursor-not-allowed"
          title={`Go to Last Page (${meta.totalPages})`}
        >
          <span className="hidden sm:inline">Last</span>
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Quick Jump Input */}
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 ml-2">
          <input
            type="number"
            min={1}
            max={meta.totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            placeholder="Go"
            className="w-12 h-8 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-center text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
            title="Type page number and press Enter"
          />
        </form>
      </div>
    </div>
  );
}

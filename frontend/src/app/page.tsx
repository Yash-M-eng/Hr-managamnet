'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/lib/currency-context';
import { api } from '@/lib/api';
import { Sparkles, RefreshCw, ShieldAlert } from 'lucide-react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { CountryBenchmarkTable } from '@/components/dashboard/CountryBenchmarkTable';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { reportingCurrency, formatReportingAmount } = useCurrency();
  const router = useRouter();

  const [overview, setOverview] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [ovRes, ctRes, dpRes, dsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/countries'),
        api.get('/analytics/departments'),
        api.get('/analytics/distribution'),
      ]);

      setOverview(ovRes.data);
      setCountries(ctRes.data);
      setDepartments(dpRes.data);
      setDistribution(dsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white rounded-3xl border border-slate-200/80 shadow-xs"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white rounded-3xl border border-slate-200/80 shadow-xs"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-white rounded-3xl border border-slate-200/80 shadow-xs"></div>
          <div className="h-96 bg-white rounded-3xl border border-slate-200/80 shadow-xs"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <p className="font-semibold text-lg">Unable to load organizational metrics</p>
        </div>
        <p className="text-sm mt-1 text-rose-700">{error}</p>
        <button
          onClick={() => fetchDashboardData(true)}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pb-12 pr-1 select-text">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>Real-Time Organization Payroll Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              Welcome back, <span className="text-[#1864f7]">{user?.name || 'HR Lead'}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Global compensation analytics and multi-currency salary records across 10,000 employees. All reporting aggregates normalized to USD.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs hover:border-slate-300 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#1864f7] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Recalculating...' : 'Refresh Aggregates'}</span>
            </button>
            <button
              onClick={() => router.push('/ai-assistant')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1864f7] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <DashboardStats
        overview={overview}
        reportingCurrency={reportingCurrency}
        formatReportingAmount={formatReportingAmount}
      />

      {/* Charts Section */}
      <DashboardCharts
        departments={departments}
        distribution={distribution}
      />

      {/* Multinational Benchmark Table */}
      <CountryBenchmarkTable
        countries={countries}
        reportingCurrency={reportingCurrency}
        formatReportingAmount={formatReportingAmount}
      />
    </div>
  );
}

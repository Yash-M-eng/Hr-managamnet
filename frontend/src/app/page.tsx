'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/lib/currency-context';
import { api, formatCurrency } from '@/lib/api';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Sparkles,
  Building,
  MapPin,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

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
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const DEPT_COLORS = ['#6366f1', '#4f46e5', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#8b5cf6'];
  const TIER_COLORS = ['#0284c7', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#6366f1'];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pb-12 pr-1 select-text">
      {/* Premium Hero Welcome Banner - Clean Light SaaS Container */}
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

      {/* 4 Executive KPI Cards - Clean White SaaS Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Headcount Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Headcount</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1864f7] border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
              {overview?.totalActiveEmployees?.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Across 6 Countries & 8 Depts</span>
            </div>
          </div>
        </div>

        {/* Total Annual Base Payroll Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annual Base Payroll ({reportingCurrency.code})</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="font-bold text-xs">{reportingCurrency.symbol}</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
              {formatReportingAmount(overview?.totalAnnualBaseSalaryUSD || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Total Comp: <strong className="text-slate-800">{formatReportingAmount(overview?.totalAnnualCompensationUSD || 0)}</strong>
            </p>
          </div>
        </div>

        {/* Average Base Pay Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Base Pay ({reportingCurrency.code})</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {formatReportingAmount(overview?.averageAnnualBaseSalaryUSD || 0)}
            </h3>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
              <span>Median: <strong className="text-slate-800">{formatReportingAmount(overview?.medianAnnualBaseSalaryUSD || 0)}</strong></span>
            </div>
          </div>
        </div>

        {/* Compensation Range Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Salary Range</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-[#0f172a] tracking-tight truncate">
              {formatReportingAmount(overview?.minAnnualBaseSalaryUSD || 0)} – {formatReportingAmount(overview?.maxAnnualBaseSalaryUSD || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">Min to Max Active Base in {reportingCurrency.code}</p>
          </div>
        </div>
      </div>

      {/* Modern Charts Section - Clean White Cards with Light Tooltips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Average Base Salary Chart */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#0f172a] tracking-tight">Average Salary by Department</h2>
              <p className="text-xs text-slate-500 mt-0.5">Normalized Annual Base Pay Benchmark (USD)</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl text-[#1864f7] border border-blue-100">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="h-88 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" tickFormatter={(val) => `$${val / 1000}k`} stroke="#94a3b8" fontSize={11} />
                <YAxis 
                  dataKey="departmentName" 
                  type="category" 
                  stroke="#475569" 
                  fontSize={12} 
                  fontWeight={500}
                  width={145} 
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()} USD`, 'Avg Base Pay']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '14px', color: '#0f172a', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: '600' }}
                />
                <Bar dataKey="avgSalaryUSD" radius={[0, 8, 8, 0]} barSize={22}>
                  {departments.map((entry, index) => (
                    <Cell key={`dept-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Distribution Tiers Chart */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#0f172a] tracking-tight">Employee Salary Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Headcount across compensation brackets</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
                <XAxis dataKey="tier" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} employees`, 'Headcount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '14px', color: '#0f172a', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell key={`tier-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multinational Headcount & Payroll Benchmark Table - Clean Light Container */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a] tracking-tight">Multinational Headcount & Payroll Benchmark</h2>
            <p className="text-xs text-slate-500 mt-0.5">Aggregated using official database reference exchange rates</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-[#1864f7]" />
            <span>6 Global Jurisdictions</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Country</th>
                <th className="px-5 py-3.5">Local Currency</th>
                <th className="px-5 py-3.5">Exchange Rate (to USD)</th>
                <th className="px-5 py-3.5">Active Headcount</th>
                <th className="px-5 py-3.5">Average Base ({reportingCurrency.code})</th>
                <th className="px-5 py-3.5">Total Payroll ({reportingCurrency.code})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {countries.map((c) => (
                <tr key={c.countryCode} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 text-[#0f172a] flex items-center gap-2.5 font-bold">
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-[#1864f7] rounded-md border border-blue-200 font-bold">
                      {c.countryCode}
                    </span>
                    <span>{c.countryName}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[#1864f7] font-bold">{c.currency}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-500">{c.exchangeRate}</td>
                  <td className="px-5 py-3.5 text-[#0f172a] font-bold">{c.employeeCount.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-emerald-600 font-bold">{formatReportingAmount(c.avgSalaryUSD)}</td>
                  <td className="px-5 py-3.5 text-slate-900 font-bold">{formatReportingAmount(c.totalSalaryUSD)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

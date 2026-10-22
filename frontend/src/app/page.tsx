'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
        <div className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-88 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
          <div className="h-88 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 shadow-xl">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <p className="font-semibold text-lg">Unable to load organizational metrics</p>
        </div>
        <p className="text-sm mt-1 text-rose-400/80">{error}</p>
        <button
          onClick={() => fetchDashboardData(true)}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const DEPT_COLORS = ['#6366f1', '#4f46e5', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#8b5cf6'];
  const TIER_COLORS = ['#0284c7', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#6366f1'];

  return (
    <div className="space-y-8 pb-16">
      {/* Premium Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/20 p-8 shadow-2xl shadow-indigo-950/30">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real-Time Organization Payroll Analytics</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-indigo-200 via-white to-slate-200 bg-clip-text text-transparent">{user?.name || 'HR Lead'}</span>
            </h1>
            <p className="text-sm text-slate-300/80 mt-1.5 max-w-2xl leading-relaxed">
              Global compensation analytics and multi-currency salary records across 10,000 employees. All reporting aggregates normalized to USD.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Recalculating...' : 'Refresh Aggregates'}</span>
            </button>
            <button
              onClick={() => router.push('/ai-assistant')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Enhanced Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Headcount Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Headcount</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {overview?.totalActiveEmployees?.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Across 6 Countries & 8 Depts</span>
            </div>
          </div>
        </div>

        {/* Total Annual Base Payroll Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annual Base Payroll</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {formatCurrency(overview?.totalAnnualBaseSalaryUSD || 0)}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">
              Total Comp: <strong className="text-slate-200">{formatCurrency(overview?.totalAnnualCompensationUSD || 0)}</strong>
            </p>
          </div>
        </div>

        {/* Average Base Pay Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Base Pay</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {formatCurrency(overview?.averageAnnualBaseSalaryUSD || 0)}
            </h3>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
              <span>Median: <strong className="text-emerald-300">{formatCurrency(overview?.medianAnnualBaseSalaryUSD || 0)}</strong></span>
            </div>
          </div>
        </div>

        {/* Compensation Range Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 hover:border-purple-500/40 shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Salary Range</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white tracking-tight truncate">
              {formatCurrency(overview?.minAnnualBaseSalaryUSD || 0)} – {formatCurrency(overview?.maxAnnualBaseSalaryUSD || 0)}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">Min to Max Active Base in USD</p>
          </div>
        </div>
      </div>

      {/* Modern Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Average Base Salary Chart */}
        <div className="p-7 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Average Salary by Department</h2>
              <p className="text-xs text-slate-400 mt-0.5">Normalized Annual Base Pay Benchmark (USD)</p>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" tickFormatter={(val) => `$${val / 1000}k`} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="departmentName" type="category" stroke="#cbd5e1" fontSize={11} width={130} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()} USD`, 'Avg Base Pay']}
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                />
                <Bar dataKey="avgSalaryUSD" radius={[0, 6, 6, 0]}>
                  {departments.map((entry, index) => (
                    <Cell key={`dept-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Distribution Tiers Chart */}
        <div className="p-7 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Employee Salary Distribution</h2>
              <p className="text-xs text-slate-400 mt-0.5">Headcount across compensation brackets</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
                <XAxis dataKey="tier" stroke="#cbd5e1" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} employees`, 'Headcount']}
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
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

      {/* Multinational Headcount & Payroll Benchmark Table */}
      <div className="p-7 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-slate-800/80 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Multinational Headcount & Payroll Benchmark</h2>
            <p className="text-xs text-slate-400 mt-0.5">Aggregated using official database reference exchange rates</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>6 Global Jurisdictions</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Country</th>
                <th className="px-5 py-3.5 font-semibold">Currency</th>
                <th className="px-5 py-3.5 font-semibold">Exchange Rate (to USD)</th>
                <th className="px-5 py-3.5 font-semibold">Active Headcount</th>
                <th className="px-5 py-3.5 font-semibold">Average Base (USD)</th>
                <th className="px-5 py-3.5 font-semibold">Total Payroll (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {countries.map((c) => (
                <tr key={c.countryCode} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4 text-white flex items-center gap-2.5 font-semibold">
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                      {c.countryCode}
                    </span>
                    <span>{c.countryName}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-indigo-300 font-bold">{c.currency}</td>
                  <td className="px-5 py-4 font-mono text-slate-400">{c.exchangeRate}</td>
                  <td className="px-5 py-4 text-white font-bold">{c.employeeCount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-emerald-400 font-bold">{formatCurrency(c.avgSalaryUSD)}</td>
                  <td className="px-5 py-4 text-slate-200 font-bold">{formatCurrency(c.totalSalaryUSD)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Building,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
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
        <div className="h-10 bg-slate-800/60 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-800/40 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-800/40 rounded-xl"></div>
          <div className="h-80 bg-slate-800/40 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300">
        <p className="font-semibold text-lg">Unable to load organizational metrics</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900/60 to-slate-900/40 border border-indigo-800/30">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome, {user?.name || 'HR Manager'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global organizational compensation metrics across 10,000 active employees. All values normalized to USD.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh SQL Aggregates</span>
          </button>
          <button
            onClick={() => router.push('/ai-assistant')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Assistant</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Active Headcount */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white">
              {overview?.totalActiveEmployees?.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Across 6 Countries & 8 Depts</p>
          </div>
        </div>

        {/* Total Annual Base Payroll */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Base Payroll</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white">
              {formatCurrency(overview?.totalAnnualBaseSalaryUSD || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Annualized Base Salaries</p>
          </div>
        </div>

        {/* Average Annual Base Salary */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Base Pay</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white">
              {formatCurrency(overview?.averageAnnualBaseSalaryUSD || 0)}
            </h3>
            <p className="text-xs text-emerald-400 mt-1">Median: {formatCurrency(overview?.medianAnnualBaseSalaryUSD || 0)}</p>
          </div>
        </div>

        {/* Salary Range (Min / Max) */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compensation Range</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-white truncate">
              {formatCurrency(overview?.minAnnualBaseSalaryUSD || 0)} - {formatCurrency(overview?.maxAnnualBaseSalaryUSD || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Min Base to Max Base in USD</p>
          </div>
        </div>
      </div>

      {/* Charts Section: Department Average & Salary Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Average Base Salary Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Average Salary by Department</h2>
              <p className="text-xs text-slate-400 mt-0.5">Normalized Annual USD Benchmark</p>
            </div>
            <Building className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" tickFormatter={(val) => `$${val / 1000}k`} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="departmentCode" type="category" stroke="#94a3b8" fontSize={11} width={45} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()} USD`, 'Avg Base Pay']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="avgSalaryUSD" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Distribution Tiers */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Employee Salary Distribution</h2>
              <p className="text-xs text-slate-400 mt-0.5">Headcount across compensation brackets</p>
            </div>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="tier" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} employees`, 'Headcount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Country Breakdown Table */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Multinational Headcount & Payroll Benchmark</h2>
            <p className="text-xs text-slate-400 mt-0.5">Calculated using database fixed reference exchange rates</p>
          </div>
          <MapPin className="w-4 h-4 text-indigo-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Exchange Rate (to USD)</th>
                <th className="px-4 py-3">Active Employees</th>
                <th className="px-4 py-3">Average Base (USD)</th>
                <th className="px-4 py-3">Total Payroll (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {countries.map((c) => (
                <tr key={c.countryCode} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-mono bg-slate-800 rounded text-slate-300 border border-slate-700">
                      {c.countryCode}
                    </span>
                    <span>{c.countryName}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-indigo-400">{c.currency}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-400">{c.exchangeRate}</td>
                  <td className="px-4 py-3.5 font-medium">{c.employeeCount.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-emerald-400 font-semibold">{formatCurrency(c.avgSalaryUSD)}</td>
                  <td className="px-4 py-3.5 font-medium">{formatCurrency(c.totalSalaryUSD)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
